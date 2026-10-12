package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.service.MlPredictionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ml-monitoring")
@CrossOrigin(origins = "http://localhost:5173")
public class MlMonitoringController {

    private final MlPredictionService predictionService;

    public MlMonitoringController(MlPredictionService predictionService) {
        this.predictionService = predictionService;
    }

    @GetMapping
    public ResponseEntity<?> monitoring(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401)
                    .body(java.util.Map.of("message", "Please log in first."));
        }
        return ResponseEntity.ok(predictionService.monitoringSnapshot());
    }
}
