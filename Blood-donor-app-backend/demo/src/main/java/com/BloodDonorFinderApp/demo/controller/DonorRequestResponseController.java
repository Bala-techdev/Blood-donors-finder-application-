package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.entity.DonorRequestResponse;
import com.BloodDonorFinderApp.demo.service.DonorRequestResponseService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/request-responses")
@CrossOrigin(origins = "http://localhost:5173")
public class DonorRequestResponseController {

    private final DonorRequestResponseService responseService;


    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    public DonorRequestResponseController(
            DonorRequestResponseService responseService
    ) {
        this.responseService = responseService;
    }


    // ==========================================
    // DONOR → ACCEPT / I CAN HELP
    // ==========================================

    @PostMapping("/request/{requestId}/user/{userId}")
    public ResponseEntity<?> respondToRequest(

            @PathVariable Long requestId,

            @PathVariable Long userId
    ) {

        try {

            DonorRequestResponse response =
                    responseService.respondToRequest(
                            requestId,
                            userId
                    );

            return ResponseEntity.status(
                    HttpStatus.CREATED
            ).body(response);

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
    // GET ALL RESPONSES BY A DONOR
    // ==========================================

    @GetMapping("/donor/{donorId}")
    public ResponseEntity<List<DonorRequestResponse>>
    getResponsesByDonor(

            @PathVariable Long donorId
    ) {

        List<DonorRequestResponse> responses =
                responseService
                        .getResponsesByDonor(donorId);

        return ResponseEntity.ok(responses);
    }


    // ==========================================
    // AI → RECOMMEND DONOR
    // ==========================================
    //
    // This endpoint stores AI matching results.
    //
    // Example:
    //
    // POST:
    // /api/request-responses/recommend/request/16/donor/1
    //
    // Parameters:
    //
    // ?matchScore=95.5&distance=2.3
    //
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

            return ResponseEntity.status(
                    HttpStatus.CREATED
            ).body(response);

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

    @PostMapping("/request/{requestId}/user/{userId}/decline")
    public ResponseEntity<?> declineRequest(

            @PathVariable Long requestId,

            @PathVariable Long userId
    ) {

        try {

            DonorRequestResponse response =
                    responseService.declineRequest(
                            requestId,
                            userId
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
}