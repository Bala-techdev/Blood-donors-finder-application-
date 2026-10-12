package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.dto.BloodShortageRisk;
import com.BloodDonorFinderApp.demo.service.BloodShortageRiskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "http://localhost:5173")
public class BloodShortageRiskController {

    private final BloodShortageRiskService riskService;

    public BloodShortageRiskController(BloodShortageRiskService riskService) {
        this.riskService = riskService;
    }

    @GetMapping("/shortage-risk")
    public ResponseEntity<BloodShortageRisk> getShortageRisk(
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(riskService.assess());
    }
}
