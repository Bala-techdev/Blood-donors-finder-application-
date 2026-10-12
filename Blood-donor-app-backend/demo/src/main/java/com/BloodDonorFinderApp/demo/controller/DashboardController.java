package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.dto.DashboardStats;
import com.BloodDonorFinderApp.demo.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:5173")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/me")
    public ResponseEntity<DashboardStats> getMyDashboard(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                dashboardService.getStats(authentication.getName())
        );
    }
}
