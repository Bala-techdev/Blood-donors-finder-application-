package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.service.EmergencyEscalationService;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/emergency")
@CrossOrigin(origins = "http://localhost:5173")
public class EmergencyEscalationController {

    private final EmergencyEscalationService service;
    private final BloodRequestRepository requestRepository;

    public EmergencyEscalationController(
            EmergencyEscalationService service,
            BloodRequestRepository requestRepository
    ) {
        this.service = service;
        this.requestRepository = requestRepository;
    }

    @PostMapping("/{requestId}/escalate")
    public ResponseEntity<?> escalateRequest(
            @PathVariable Long requestId
            ,
            Authentication authentication
    ) {

        try {
            assertOwner(requestId, authentication);

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

    @GetMapping("/{requestId}/recommendation")
    public ResponseEntity<?> recommendNextAction(
            @PathVariable Long requestId,
            Authentication authentication
    ) {
        try {
            assertOwner(requestId, authentication);
            return ResponseEntity.ok(
                    service.recommendNextAction(requestId)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{requestId}/coordinator")
    public ResponseEntity<?> coordinate(
            @PathVariable Long requestId,
            Authentication authentication
    ) {
        try {
            assertOwner(requestId, authentication);
            return ResponseEntity.ok(service.coordinate(requestId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(java.util.Map.of("message", e.getMessage()));
        }
    }

    private void assertOwner(
            Long requestId,
            Authentication authentication
    ) {
        if (!requestRepository.findById(requestId)
                .map(request -> request.getRequester() != null
                        && request.getRequester().getEmail()
                        .equals(authentication.getName()))
                .orElse(false)) {
            throw new RuntimeException(
                    "Only the request owner can manage escalation"
            );
        }
    }
}