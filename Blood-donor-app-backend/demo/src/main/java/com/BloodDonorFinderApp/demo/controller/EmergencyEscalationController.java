package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.service.EmergencyEscalationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/emergency")
@CrossOrigin(origins = "http://localhost:5173")
public class EmergencyEscalationController {

    private final EmergencyEscalationService service;

    public EmergencyEscalationController(
            EmergencyEscalationService service
    ) {
        this.service = service;
    }

    @GetMapping("/{requestId}/status")
    public ResponseEntity<?> getStatus(
            @PathVariable Long requestId
    ) {

        return ResponseEntity.ok(
                java.util.Map.of(
                        "requestId",
                        requestId,
                        "status",
                        service.getEscalationStatus(requestId)
                )
        );
    }

    @GetMapping("/{requestId}/accepted")
    public ResponseEntity<?> getAcceptedDonors(
            @PathVariable Long requestId
    ) {

        return ResponseEntity.ok(
                service.getAcceptedDonors(requestId)
        );
    }
}