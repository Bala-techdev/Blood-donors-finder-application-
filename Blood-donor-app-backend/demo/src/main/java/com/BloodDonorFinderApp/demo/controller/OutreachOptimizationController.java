package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.service.OutreachOptimizationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/outreach")
@CrossOrigin(origins = "http://localhost:5173")
public class OutreachOptimizationController {

    private final OutreachOptimizationService service;

    public OutreachOptimizationController(OutreachOptimizationService service) {
        this.service = service;
    }

    @GetMapping("/request/{requestId}/recommendations")
    public ResponseEntity<?> recommendations(
            @PathVariable Long requestId,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Please log in first."));
        }
        try {
            return ResponseEntity.ok(service.optimize(requestId, authentication.getName()));
        } catch (RuntimeException exception) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", exception.getMessage()));
        }
    }
}
