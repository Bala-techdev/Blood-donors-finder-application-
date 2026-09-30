package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.dto.EmergencyPriorityResult;
import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.repository.DonorRequestResponseRepository;
import com.BloodDonorFinderApp.demo.service.EmergencyPriorityService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emergency")
@CrossOrigin(origins = "http://localhost:5173")
public class EmergencyController {

    private final BloodRequestRepository bloodRequestRepository;

    private final DonorRequestResponseRepository responseRepository;

    private final EmergencyPriorityService
            emergencyPriorityService;


    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    public EmergencyController(
            BloodRequestRepository bloodRequestRepository,
            DonorRequestResponseRepository responseRepository,
            EmergencyPriorityService emergencyPriorityService
    ) {

        this.bloodRequestRepository =
                bloodRequestRepository;

        this.responseRepository =
                responseRepository;

        this.emergencyPriorityService =
                emergencyPriorityService;
    }


    // ==========================================
    // GET EMERGENCY STATUS
    // ==========================================

    @GetMapping("/{requestId}/status")
    public ResponseEntity<?> getEmergencyStatus(
            @PathVariable Long requestId
    ) {

        try {

            BloodRequest request =
                    bloodRequestRepository
                            .findById(requestId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Blood request not found"
                                    )
                            );


            // ==========================================
            // ACCEPTED DONORS
            // ==========================================

            long acceptedDonors =
                    responseRepository
                            .countByBloodRequestIdAndResponse(
                                    requestId,
                                    "ACCEPTED"
                            );


            // ==========================================
            // REQUIRED UNITS
            // ==========================================

            int requiredUnits =
                    request.getUnits() == null
                            ? 1
                            : request.getUnits();


            // ==========================================
            // REMAINING UNITS
            // ==========================================

            long remainingUnits =
                    Math.max(
                            0,
                            requiredUnits - acceptedDonors
                    );


            // ==========================================
            // PRIORITY
            // ==========================================

            EmergencyPriorityResult priority =
                    emergencyPriorityService
                            .calculatePriority(
                                    requestId
                            );


            // ==========================================
            // DETERMINE ESCALATION
            // ==========================================

            String escalationStatus;

            if (
                    "FULFILLED".equalsIgnoreCase(
                            request.getStatus()
                    )
            ) {

                escalationStatus =
                        "FULFILLED";

            } else if (
                    remainingUnits > 0 &&
                            (
                                    "CRITICAL".equalsIgnoreCase(
                                            priority.getPriorityLevel()
                                    )
                                            ||
                                            "HIGH".equalsIgnoreCase(
                                                    priority.getPriorityLevel()
                                            )
                            )
            ) {

                escalationStatus =
                        "ESCALATED";

            } else {

                escalationStatus =
                        "NORMAL_MONITORING";
            }


            // ==========================================
            // RESPONSE
            // ==========================================

            Map<String, Object> result =
                    new HashMap<>();

            result.put(
                    "requestId",
                    request.getId()
            );

            result.put(
                    "status",
                    request.getStatus()
            );

            result.put(
                    "bloodGroup",
                    request.getBloodGroup()
            );

            result.put(
                    "requiredUnits",
                    requiredUnits
            );

            result.put(
                    "acceptedDonors",
                    acceptedDonors
            );

            result.put(
                    "remainingUnits",
                    remainingUnits
            );

            result.put(
                    "priorityLevel",
                    priority.getPriorityLevel()
            );

            result.put(
                    "priorityScore",
                    priority.getPriorityScore()
            );

            result.put(
                    "priorityReason",
                    priority.getReason()
            );

            result.put(
                    "escalationStatus",
                    escalationStatus
            );


            return ResponseEntity.ok(result);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    e.getMessage()
                            )
                    );
        }
    }


    // ==========================================
    // GET ACCEPTED DONORS
    // ==========================================

    @GetMapping("/{requestId}/accepted")
    public ResponseEntity<?> getAcceptedDonors(
            @PathVariable Long requestId
    ) {

        try {

            List<?> acceptedDonors =
                    responseRepository
                            .findByBloodRequestIdAndResponseOrderByMatchScoreDesc(
                                    requestId,
                                    "ACCEPTED"
                            );

            return ResponseEntity.ok(
                    acceptedDonors
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    e.getMessage()
                            )
                    );
        }
    }
}