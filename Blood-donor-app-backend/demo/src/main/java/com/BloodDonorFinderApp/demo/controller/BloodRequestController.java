package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.service.BloodRequestService;
import com.BloodDonorFinderApp.demo.service.EmergencyPriorityService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "http://localhost:5173")
public class BloodRequestController {

    private final BloodRequestService bloodRequestService;
    private final EmergencyPriorityService emergencyPriorityService;

    public BloodRequestController(
            BloodRequestService bloodRequestService,
            EmergencyPriorityService emergencyPriorityService
    ) {
        this.bloodRequestService = bloodRequestService;
        this.emergencyPriorityService = emergencyPriorityService;
    }


    // =========================================================
    // CREATE BLOOD REQUEST
    // =========================================================

    @PostMapping
    public ResponseEntity<?> createRequest(
            @RequestBody BloodRequest request,
            Authentication authentication
    ) {

        try {

            String email = authentication.getName();

            BloodRequest createdRequest =
                    bloodRequestService.createRequest(
                            request,
                            email
                    );

            return new ResponseEntity<>(
                    createdRequest,
                    HttpStatus.CREATED
            );

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    e.getMessage()
                            )
                    );
        }
    }


    // =========================================================
    // GET ALL REQUESTS
    // =========================================================

    @GetMapping
    public ResponseEntity<List<BloodRequest>> getAllRequests() {

        return ResponseEntity.ok(
                bloodRequestService.getAllRequests()
        );
    }


    // =========================================================
    // GET REQUEST BY ID
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<BloodRequest> getRequestById(
            @PathVariable Long id
            ,
            Authentication authentication
    ) {

        return bloodRequestService.getRequestById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }


    // =========================================================
    // GET REQUESTS BY BLOOD GROUP
    // =========================================================

    @GetMapping("/blood-group/{bloodGroup}")
    public ResponseEntity<List<BloodRequest>> getByBloodGroup(
            @PathVariable String bloodGroup
    ) {

        return ResponseEntity.ok(
                bloodRequestService
                        .getRequestsByBloodGroup(bloodGroup)
        );
    }


    // =========================================================
    // GET PENDING REQUESTS
    // =========================================================

    @GetMapping("/pending")
    public ResponseEntity<List<BloodRequest>> getPendingRequests() {

        return ResponseEntity.ok(
                bloodRequestService.getPendingRequests()
        );
    }


    // =========================================================
    // GET MY REQUESTS
    // =========================================================

    @GetMapping("/me")
    public ResponseEntity<?> getMyRequests(
            Authentication authentication
    ) {

        try {

            String email = authentication.getName();

            return ResponseEntity.ok(
                    bloodRequestService
                            .getRequestsByUserEmail(email)
            );

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    e.getMessage()
                            )
                    );
        }
    }


    // =========================================================
    // UPDATE MY REQUEST STATUS
    // =========================================================

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            Authentication authentication
    ) {

        try {

            String email = authentication.getName();

            return ResponseEntity.ok(
                    bloodRequestService.updateStatus(
                            id,
                            status,
                            email
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    e.getMessage()
                            )
                    );
        }
    }


    // =========================================================
    // EMERGENCY PRIORITY
    // =========================================================

    @GetMapping("/{id}/priority")
    public ResponseEntity<?> getEmergencyPriority(
            @PathVariable Long id,
            Authentication authentication
    ) {

        try {

            return ResponseEntity.ok(
                    emergencyPriorityService.calculatePriority(
                            id,
                            authentication.getName()
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    e.getMessage()
                            )
                    );
        }
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMyRequest(
            @PathVariable Long id,
            Authentication authentication) {

        try {
            bloodRequestService.deleteMyRequest(
                    id,
                    authentication.getName());

            return ResponseEntity.noContent().build();

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }
}