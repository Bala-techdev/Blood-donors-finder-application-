package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import com.BloodDonorFinderApp.demo.service.DonorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/donors")
@CrossOrigin(origins = "http://localhost:5173")
public class DonorController {

    private final DonorService donorService;

    public DonorController(DonorService donorService) {
        this.donorService = donorService;
    }

    @PostMapping
    public ResponseEntity<DonorProfile> createDonor(
            @RequestBody DonorProfile donorProfile
    ) {

        DonorProfile createdDonor =
                donorService.createDonor(donorProfile);

        return new ResponseEntity<>(
                createdDonor,
                HttpStatus.CREATED
        );
    }

    @GetMapping
    public ResponseEntity<List<DonorProfile>> getAllDonors() {
        return ResponseEntity.ok(
                donorService.getAllDonors()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<DonorProfile> getDonorById(
            @PathVariable Long id
    ) {

        return donorService.getDonorById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<List<DonorProfile>> searchDonors(
            @RequestParam(required = false) String bloodGroup,
            @RequestParam(required = false) String location
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
}