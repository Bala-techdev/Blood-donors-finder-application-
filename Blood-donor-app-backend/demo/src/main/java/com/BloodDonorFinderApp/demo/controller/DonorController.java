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

        return new ResponseEntity<>(
                createdDonor,
                HttpStatus.CREATED
        );
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
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    // ==========================================
    // GET ALL DONORS
    // ==========================================

    @GetMapping
    public ResponseEntity<List<DonorProfile>> getAllDonors() {

        return ResponseEntity.ok(
                donorService.getAllDonors()
        );
    }

    // ==========================================
    // GET DONOR BY ID
    // ==========================================

    @GetMapping("/{id}")
    public ResponseEntity<DonorProfile> getDonorById(
            @PathVariable Long id
    ) {

        return donorService
                .getDonorById(id)
                .map(ResponseEntity::ok)
                .orElse(
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

        if (bloodGroup != null && location != null) {

            return ResponseEntity.ok(
                    donorService.searchDonors(
                            bloodGroup,
                            location
                    )
            );
        }

        if (bloodGroup != null) {

            return ResponseEntity.ok(
                    donorService.searchByBloodGroup(
                            bloodGroup
                    )
            );
        }

        if (location != null) {

            return ResponseEntity.ok(
                    donorService.searchByLocation(
                            location
                    )
            );
        }

        return ResponseEntity.ok(
                donorService.getAllDonors()
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
                                    new RuntimeException(
                                            "Blood request not found"
                                    )
                            );

            List<DonorMatchingService.DonorMatchResult>
                    matches =
                    donorMatchingService
                            .findBestDonors(request);

            return ResponseEntity.ok(matches);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    e.getMessage()
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