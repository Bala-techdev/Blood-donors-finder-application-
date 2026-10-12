package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import com.BloodDonorFinderApp.demo.service.BloodRequestService;
import com.BloodDonorFinderApp.demo.service.DonorMatchingService;
import com.BloodDonorFinderApp.demo.service.DonorService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/donors")
@CrossOrigin(origins = "http://localhost:5173")
public class DonorController {

    private final DonorService donorService;
    private final DonorMatchingService donorMatchingService;
    private final BloodRequestService bloodRequestService;

    public DonorController(
            DonorService donorService,
            DonorMatchingService donorMatchingService,
            BloodRequestService bloodRequestService
    ) {
        this.donorService = donorService;
        this.donorMatchingService = donorMatchingService;
        this.bloodRequestService = bloodRequestService;
    }

    // ==========================================
    // CREATE DONOR
    // ==========================================

    @PostMapping
    public ResponseEntity<DonorProfile> createDonor(
            @RequestBody DonorProfile donorProfile,
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
            @RequestBody DonorProfile updatedProfile,
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
    public ResponseEntity<List<DonorProfile>> searchDonors(
            @RequestParam(required = false)
            String bloodGroup,

            @RequestParam(required = false)
            String location
    ) {
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
    public ResponseEntity<
            List<DonorMatchingService.DonorMatchResult>
            > findMatchingDonors(
            @RequestBody BloodRequest request
    ) {
        return ResponseEntity.ok(
                donorMatchingService.findBestDonors(
                        request
                )
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