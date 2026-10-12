package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.dto.AcceptedDonorDTO;
import com.BloodDonorFinderApp.demo.dto.DonorReliabilityResult;
import com.BloodDonorFinderApp.demo.entity.DonorRequestResponse;
import com.BloodDonorFinderApp.demo.service.DonorReliabilityService;
import com.BloodDonorFinderApp.demo.service.DonorRequestResponseService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/request-responses")
@CrossOrigin(origins = "http://localhost:5173")
public class DonorRequestResponseController {

    private final DonorRequestResponseService responseService;
    private final DonorReliabilityService reliabilityService;

    public DonorRequestResponseController(
            DonorRequestResponseService responseService,
            DonorReliabilityService reliabilityService
    ) {
        this.responseService = responseService;
        this.reliabilityService = reliabilityService;
    }

    // =====================================================
    // DONOR: ACCEPT A BLOOD REQUEST
    // POST /api/request-responses/request/{requestId}/respond
    // =====================================================

    @PostMapping("/request/{requestId}/respond")
    public ResponseEntity<?> respondToRequest(
            @PathVariable Long requestId,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first."));
        }

        try {
            String email = authentication.getName();

            DonorRequestResponse response =
                    responseService.respondToRequest(requestId, email);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            e.getMessage() == null
                                    ? "Unable to accept this request."
                                    : e.getMessage()
                    ));
        }
    }

    // =====================================================
    // GET RESPONSES FOR A REQUEST
    // GET /api/request-responses/request/{requestId}
    // =====================================================

    @GetMapping("/request/{requestId}")
    public ResponseEntity<?> getResponsesForRequest(
            @PathVariable Long requestId,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first."));
        }

        try {
            List<DonorRequestResponse> responses =
                    responseService.getResponsesForRequest(requestId, authentication.getName());

            return ResponseEntity.ok(responses);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            e.getMessage() == null
                                    ? "Unable to retrieve responses."
                                    : e.getMessage()
                    ));
        }
    }

    // =====================================================
    // GET THE CURRENT DONOR'S RESPONSES
    // GET /api/request-responses/me
    // =====================================================

    @GetMapping("/me")
    public ResponseEntity<?> getMyResponses(
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first."));
        }

        try {
            String email = authentication.getName();

            List<DonorRequestResponse> responses =
                    responseService.getResponsesByUserEmail(email);

            return ResponseEntity.ok(responses);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            e.getMessage() == null
                                    ? "Unable to retrieve your responses."
                                    : e.getMessage()
                    ));
        }
    }

    // =====================================================
    // AI: RECOMMEND A DONOR
    // POST /api/request-responses/recommend/request/{requestId}/donor/{donorId}
    // =====================================================

    @PostMapping("/recommend/request/{requestId}/donor/{donorId}")
    public ResponseEntity<?> recommendDonor(
            @PathVariable Long requestId,
            @PathVariable Long donorId,
            Authentication authentication,
            @RequestParam Double matchScore,
            @RequestParam Double distance
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first."));
        }

        try {
            DonorRequestResponse response =
                    responseService.recommendDonor(
                            requestId,
                            donorId,
                            matchScore,
                            distance,
                            authentication.getName()
                    );

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            e.getMessage() == null
                                    ? "Unable to recommend this donor."
                                    : e.getMessage()
                    ));
        }
    }

    // =====================================================
    // DONOR: DECLINE A REQUEST
    // POST /api/request-responses/request/{requestId}/decline
    // =====================================================

    @PostMapping("/request/{requestId}/decline")
    public ResponseEntity<?> declineRequest(
            @PathVariable Long requestId,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first."));
        }

        try {
            String email = authentication.getName();

            DonorRequestResponse response =
                    responseService.declineRequest(requestId, email);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            e.getMessage() == null
                                    ? "Unable to decline this request."
                                    : e.getMessage()
                    ));
        }
    }

    // =====================================================
    // GET DONOR RELIABILITY
    // GET /api/request-responses/donor/{donorId}/reliability
    // =====================================================

    @GetMapping("/donor/{donorId}/reliability")
    public ResponseEntity<?> getDonorReliability(
            @PathVariable Long donorId
    ) {
        try {
            DonorReliabilityResult result =
                    reliabilityService.calculateReliability(donorId);

            return ResponseEntity.ok(result);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            e.getMessage() == null
                                    ? "Unable to calculate donor reliability."
                                    : e.getMessage()
                    ));
        }
    }

    // =====================================================
    // REQUESTER: GET ACCEPTED DONORS FOR THEIR REQUEST
    // GET /api/request-responses/request/{requestId}/accepted
    // =====================================================

    @GetMapping("/request/{requestId}/accepted")
    public ResponseEntity<?> getAcceptedDonors(
            @PathVariable Long requestId,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first."));
        }

        try {
            String email = authentication.getName();

            List<AcceptedDonorDTO> acceptedDonors =
                    responseService.getAcceptedDonorsForRequester(
                            requestId,
                            email
                    );

            return ResponseEntity.ok(acceptedDonors);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            e.getMessage() == null
                                    ? "Unable to retrieve accepted donors."
                                    : e.getMessage()
                    ));
        }
    }
}