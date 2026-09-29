package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import com.BloodDonorFinderApp.demo.repository.DonorProfileRepository;
import com.BloodDonorFinderApp.demo.service.DonationEligibilityService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/donors")
@CrossOrigin(origins = "http://localhost:5173")
public class DonationEligibilityController {

    private final DonorProfileRepository donorProfileRepository;

    private final DonationEligibilityService
            donationEligibilityService;


    public DonationEligibilityController(
            DonorProfileRepository donorProfileRepository,
            DonationEligibilityService donationEligibilityService
    ) {

        this.donorProfileRepository =
                donorProfileRepository;

        this.donationEligibilityService =
                donationEligibilityService;
    }


    @GetMapping("/{id}/eligibility")
    public ResponseEntity<?> checkEligibility(
            @PathVariable Long id
    ) {

        DonorProfile donor =
                donorProfileRepository.findById(id)
                        .orElse(null);


        if (donor == null) {

            return ResponseEntity
                    .notFound()
                    .build();
        }


        boolean eligible =
                donationEligibilityService
                        .isEligible(donor);


        long daysSinceDonation =
                donationEligibilityService
                        .getDaysSinceLastDonation(donor);


        long remainingDays =
                donationEligibilityService
                        .getRemainingDays(donor);


        Map<String, Object> response =
                new HashMap<>();


        response.put("donorId", donor.getId());

        response.put(
                "eligible",
                eligible
        );

        response.put(
                "lastDonationDate",
                donor.getLastDonationDate()
        );

        response.put(
                "daysSinceLastDonation",
                daysSinceDonation
        );

        response.put(
                "remainingDays",
                remainingDays
        );


        return ResponseEntity.ok(response);
    }
}