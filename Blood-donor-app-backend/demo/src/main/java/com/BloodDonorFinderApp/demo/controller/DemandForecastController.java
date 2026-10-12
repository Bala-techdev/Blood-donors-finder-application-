package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.dto.DemandForecast;
import com.BloodDonorFinderApp.demo.service.DemandForecastService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "http://localhost:5173")
public class DemandForecastController {

    private final DemandForecastService demandForecastService;

    public DemandForecastController(DemandForecastService demandForecastService) {
        this.demandForecastService = demandForecastService;
    }

    @GetMapping("/demand")
    public ResponseEntity<DemandForecast> getDemandForecast(
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(demandForecastService.getForecast());
    }
}
