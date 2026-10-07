package com.BloodDonorFinderApp.demo.controller;

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

    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    public DonorRequestResponseController(
            DonorRequestResponseService responseService,
            DonorReliabilityService reliabilityService
    ) {
        this.responseService = responseService;
        this.reliabilityService = reliabilityService;
    }

    // ==========================================
    // DONOR → ACCEPT / I CAN HELP
    // ==========================================

    @PostMapping("/request/{requestId}/respond")
    public ResponseEntity<?> respondToRequest(
            @PathVariable Long requestId,
            Authentication authentication
    ) {

        try {

            String email = authentication.getName();

            DonorRequestResponse response =
                    responseService.respondToRequest(
                            requestId,
                            email
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);

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
    // GET ALL RESPONSES FOR A BLOOD REQUEST
    // ==========================================

    @GetMapping("/request/{requestId}")
    public ResponseEntity<List<DonorRequestResponse>>
    getResponsesForRequest(
            @PathVariable Long requestId
    ) {

        List<DonorRequestResponse> responses =
                responseService
                        .getResponsesForRequest(requestId);

        return ResponseEntity.ok(responses);
    }

    // ==========================================
    // GET MY RESPONSES
    // ==========================================

    @GetMapping("/me")
    public ResponseEntity<?> getMyResponses(
            Authentication authentication
    ) {

        try {

            String email = authentication.getName();

            List<DonorRequestResponse> responses =
                    responseService.getResponsesByUserEmail(
                            email
                    );

            return ResponseEntity.ok(responses);

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
    // AI → RECOMMEND DONOR
    // ==========================================

    @PostMapping(
            "/recommend/request/{requestId}/donor/{donorId}"
    )
    public ResponseEntity<?> recommendDonor(
            @PathVariable Long requestId,
            @PathVariable Long donorId,
            @RequestParam Double matchScore,
            @RequestParam Double distance
    ) {

        try {

            DonorRequestResponse response =
                    responseService.recommendDonor(
                            requestId,
                            donorId,
                            matchScore,
                            distance
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);

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
    // DONOR → DECLINE / CAN'T HELP
    // ==========================================

    @PostMapping("/request/{requestId}/decline")
    public ResponseEntity<?> declineRequest(
            @PathVariable Long requestId,
            Authentication authentication
    ) {

        try {

            String email = authentication.getName();

            DonorRequestResponse response =
                    responseService.declineRequest(
                            requestId,
                            email
                    );

            return ResponseEntity.ok(response);

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
    // DONOR RELIABILITY SCORE
    // ==========================================

    @GetMapping("/donor/{donorId}/reliability")
    public ResponseEntity<?> getDonorReliability(
            @PathVariable Long donorId
    ) {

        try {

            DonorReliabilityResult result =
                    reliabilityService.calculateReliability(
                            donorId
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
}