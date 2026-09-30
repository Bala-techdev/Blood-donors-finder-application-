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

    @PostMapping("/{requestId}/escalate")
    public ResponseEntity<?> escalateRequest(
            @PathVariable Long requestId
    ) {

        try {

            return ResponseEntity.ok(
                    service.escalateRequest(requestId)
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            java.util.Map.of(
                                    "message",
                                    e.getMessage()
                            )
                    );
        }
    }
}