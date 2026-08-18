package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.service.BloodRequestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "http://localhost:5173")
public class BloodRequestController {

    private final BloodRequestService bloodRequestService;

    public BloodRequestController(
            BloodRequestService bloodRequestService
    ) {
        this.bloodRequestService = bloodRequestService;
    }

    @PostMapping
    public ResponseEntity<BloodRequest> createRequest(
            @RequestBody BloodRequest request
    ) {

        BloodRequest createdRequest =
                bloodRequestService.createRequest(request);

        return new ResponseEntity<>(
                createdRequest,
                HttpStatus.CREATED
        );
    }

    @GetMapping
    public ResponseEntity<List<BloodRequest>> getAllRequests() {

        return ResponseEntity.ok(
                bloodRequestService.getAllRequests()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<BloodRequest> getRequestById(
            @PathVariable Long id
    ) {

        return bloodRequestService.getRequestById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/blood-group/{bloodGroup}")
    public ResponseEntity<List<BloodRequest>> getByBloodGroup(
            @PathVariable String bloodGroup
    ) {

        return ResponseEntity.ok(
                bloodRequestService
                        .getRequestsByBloodGroup(bloodGroup)
        );
    }

    @GetMapping("/pending")
    public ResponseEntity<List<BloodRequest>> getPendingRequests() {

        return ResponseEntity.ok(
                bloodRequestService.getPendingRequests()
        );
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BloodRequest>> getUserRequests(
            @PathVariable Long userId
    ) {

        return ResponseEntity.ok(
                bloodRequestService.getRequestsByUser(userId)
        );
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<BloodRequest> updateStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {

        return ResponseEntity.ok(
                bloodRequestService.updateStatus(
                        id,
                        status
                )
        );
    }
}