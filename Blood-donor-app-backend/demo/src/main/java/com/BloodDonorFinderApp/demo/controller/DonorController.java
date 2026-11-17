package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.repository.UserRepository;
import com.BloodDonorFinderApp.demo.service.BloodRequestService;
import com.BloodDonorFinderApp.demo.service.DonorMatchingService;
import com.BloodDonorFinderApp.demo.service.DonorService;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/donors")
public class DonorController {

    private final DonorService donorService;
    private final DonorMatchingService donorMatchingService;
    private final BloodRequestService bloodRequestService;
    private final UserRepository userRepository;

    public DonorController(
            DonorService donorService,
            DonorMatchingService donorMatchingService,
            BloodRequestService bloodRequestService,
            UserRepository userRepository
    ) {
        this.donorService = donorService;
        this.donorMatchingService = donorMatchingService;
        this.bloodRequestService = bloodRequestService;
        this.userRepository = userRepository;
    }

    // ==========================================
    // CREATE DONOR
    // ==========================================

    @PostMapping
    public ResponseEntity<DonorProfile> createDonor(
            @RequestBody @Valid DonorProfile donorProfile,
            Authentication authentication
    ) {
        String email = authentication.getName();

        DonorProfile createdDonor =
                donorService.createDonor(
                        donorProfile,
                        email
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdDonor);
    }

    // ==========================================
    // GET MY DONOR PROFILE
    // ==========================================

    @GetMapping("/me")
    public ResponseEntity<DonorProfile> getMyDonorProfile(
            Authentication authentication
    ) {
        String email = authentication.getName();

        return donorService
                .getDonorByUserEmail(email)
                .map(ResponseEntity::ok)
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
    }

    // ==========================================
    // UPDATE MY DONOR PROFILE
    // ==========================================

    @PutMapping("/me")
    public ResponseEntity<DonorProfile> updateMyDonorProfile(
            @RequestBody @Valid DonorProfile updatedProfile,
            Authentication authentication
    ) {
        String email = authentication.getName();

        DonorProfile updated =
                donorService.updateDonorProfile(
                        email,
                        updatedProfile
                );

        return ResponseEntity.ok(updated);
    }

    // ==========================================
    // GET ALL DONORS
    // ==========================================

    @GetMapping
    public ResponseEntity<List<DonorProfile>> getAllDonors() {
        List<DonorProfile> donors = donorService.getAllDonors()
                .stream()
                .map(donorService::sanitizeDonorProfile)
                .toList();

        return ResponseEntity.ok(donors);
    }

    // ==========================================
    // GET DONOR BY ID
    // ==========================================

    @GetMapping("/{id}")
    public ResponseEntity<DonorProfile> getDonorById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return donorService
                .getDonorById(id)
                .map(donor -> {
                    if (donor.getUser() != null
                            && donor.getUser().getEmail() != null
                            && donor.getUser().getEmail().equalsIgnoreCase(authentication.getName())) {
                        return ResponseEntity.ok(donor);
                    }

                    return ResponseEntity.ok(donorService.sanitizeDonorProfile(donor));
                })
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
    }

    // ==========================================
    // SEARCH DONORS
    // ==========================================

    @GetMapping("/search")
    public ResponseEntity<?> searchDonors(
            @RequestParam(required = false)
            String bloodGroup,

            @RequestParam(required = false)
            String location,

            Authentication authentication
    ) {
        // Enforce email verification check for donor search (Item 8)
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            String email = authentication.getName();
            User currentUser = email != null ? userRepository.findByEmailIgnoreCase(email.trim().toLowerCase(java.util.Locale.ROOT)).orElse(null) : null;
            if (currentUser != null && !currentUser.isEmailVerified()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "error", "EMAIL_NOT_VERIFIED",
                        "message", "Please verify your email address with OTP before searching or viewing donors."
                ));
            }
        }

        List<DonorProfile> donors;

        if (bloodGroup != null && location != null) {
            donors = donorService.searchDonors(
                    bloodGroup,
                    location
            );
        } else if (bloodGroup != null) {
            donors = donorService.searchByBloodGroup(
                    bloodGroup
            );
        } else if (location != null) {
            donors = donorService.searchByLocation(
                    location
            );
        } else {
            donors = donorService.getAllDonors();
        }

        return ResponseEntity.ok(
                donors.stream()
                        .map(donorService::sanitizeDonorProfile)
                        .toList()
        );
    }

    // ==========================================
    // SMART DONOR MATCHING
    // ==========================================

    @PostMapping("/match")
    public ResponseEntity<List<DonorMatchingService.DonorMatchResult>> findMatchingDonors(
            @RequestBody @Valid com.BloodDonorFinderApp.demo.dto.DonorMatchRequest request
    ) {
        BloodRequest bloodRequest = new BloodRequest();
        bloodRequest.setBloodGroup(request.getBloodGroup());
        bloodRequest.setLocation(request.getLocation() != null && !request.getLocation().isBlank() ? request.getLocation() : "Unknown");
        bloodRequest.setLatitude(request.getLatitude());
        bloodRequest.setLongitude(request.getLongitude());
        bloodRequest.setUrgency(request.getUrgency() != null && !request.getUrgency().isBlank() ? request.getUrgency() : "NORMAL");
        bloodRequest.setPatientName(request.getPatientName() != null && !request.getPatientName().isBlank() ? request.getPatientName() : "Search Query");
        bloodRequest.setHospitalName(request.getHospitalName() != null && !request.getHospitalName().isBlank() ? request.getHospitalName() : "Nearby Hospital");
        bloodRequest.setUnits(request.getUnits() != null ? request.getUnits() : 1);
        bloodRequest.setRequiredDate(java.time.LocalDate.now());

        return ResponseEntity.ok(
                donorMatchingService.findBestDonors(bloodRequest)
        );
    }

    // ==========================================
    // SMART MATCHING USING REQUEST ID
    // ==========================================

    @GetMapping("/match/request/{requestId}")
    public ResponseEntity<?> findMatchingDonorsByRequestId(
            @PathVariable Long requestId
    ) {
        try {
            BloodRequest request =
                    bloodRequestService
                            .getRequestById(requestId)
                            .orElseThrow(() ->
                                    new ResponseStatusException(
                                            HttpStatus.NOT_FOUND,
                                            "Blood request not found"
                                    )
                            );

            List<DonorMatchingService.DonorMatchResult>
                    matches =
                    donorMatchingService.findBestDonors(
                            request
                    );

            return ResponseEntity.ok(matches);

        } catch (ResponseStatusException e) {
            return ResponseEntity
                    .status(e.getStatusCode())
                    .body(
                            Map.of(
                                    "message",
                                    e.getReason() != null
                                            ? e.getReason()
                                            : "Request failed"
                            )
                    );
        }
    }

    // ==========================================
    // FIND NEARBY DONORS
    // ==========================================

    @GetMapping("/nearby")
    public ResponseEntity<List<DonorProfile>> findNearbyDonors(
            @RequestParam double latitude,
            @RequestParam double longitude,

            @RequestParam(defaultValue = "10")
            double radius
    ) {
        return ResponseEntity.ok(
                donorService.findNearbyDonors(
                        latitude,
                        longitude,
                        radius
                )
        );
    }
}