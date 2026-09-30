package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.DonorRequestResponse;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.repository.DonorRequestResponseRepository;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmergencyEscalationService {

    private final BloodRequestRepository requestRepository;
    private final DonorRequestResponseRepository responseRepository;
    private final DonorMatchingService donorMatchingService;
    private final DonorRequestResponseService responseService;

    public EmergencyEscalationService(
            BloodRequestRepository requestRepository,
            DonorRequestResponseRepository responseRepository,
            DonorMatchingService donorMatchingService,
            DonorRequestResponseService responseService
    ) {
        this.requestRepository = requestRepository;
        this.responseRepository = responseRepository;
        this.donorMatchingService = donorMatchingService;
        this.responseService = responseService;
    }

    // =========================================================
    // GET ESCALATION STATUS
    // =========================================================

    public String getEscalationStatus(Long requestId) {

        BloodRequest request =
                requestRepository.findById(requestId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Blood request not found"
                                )
                        );

        long accepted =
                responseRepository
                        .countByBloodRequestIdAndResponse(
                                requestId,
                                "ACCEPTED"
                        );

        int required =
                request.getUnits() == null
                        ? 1
                        : request.getUnits();

        // Already fulfilled
        if (accepted >= required ||
                "FULFILLED".equalsIgnoreCase(request.getStatus())) {

            return "FULFILLED";
        }

        // Emergency request
        if ("EMERGENCY".equalsIgnoreCase(
                request.getUrgency()
        )) {

            return "EMERGENCY_ESCALATION";
        }

        // Urgent request
        if ("URGENT".equalsIgnoreCase(
                request.getUrgency()
        )) {

            return "HIGH_PRIORITY";
        }

        return "NORMAL";
    }


    // =========================================================
    // AUTOMATIC DONOR ESCALATION
    // =========================================================

    public Map<String, Object> escalateRequest(
            Long requestId
    ) {

        BloodRequest request =
                requestRepository.findById(requestId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Blood request not found"
                                )
                        );

        long accepted =
                responseRepository
                        .countByBloodRequestIdAndResponse(
                                requestId,
                                "ACCEPTED"
                        );

        int required =
                request.getUnits() == null
                        ? 1
                        : request.getUnits();

        long remaining =
                Math.max(
                        0,
                        required - accepted
                );

        Map<String, Object> result =
                new HashMap<>();

        result.put(
                "requestId",
                requestId
        );

        result.put(
                "requiredUnits",
                required
        );

        result.put(
                "acceptedDonors",
                accepted
        );

        result.put(
                "remainingUnits",
                remaining
        );


        // =====================================================
        // ALREADY FULFILLED
        // =====================================================

        if (remaining <= 0 ||
                "FULFILLED".equalsIgnoreCase(
                        request.getStatus()
                )) {

            result.put(
                    "status",
                    "FULFILLED"
            );

            result.put(
                    "message",
                    "Blood requirement is already fulfilled."
            );

            result.put(
                    "newRecommendations",
                    0
            );

            return result;
        }


        // =====================================================
        // CHECK URGENCY
        // =====================================================

        boolean emergency =
                "EMERGENCY".equalsIgnoreCase(
                        request.getUrgency()
                );

        boolean urgent =
                "URGENT".equalsIgnoreCase(
                        request.getUrgency()
                );


        if (!emergency && !urgent) {

            result.put(
                    "status",
                    "NOT_ESCALATED"
            );

            result.put(
                    "message",
                    "Request does not require emergency escalation."
            );

            result.put(
                    "newRecommendations",
                    0
            );

            return result;
        }


        // =====================================================
        // RUN SMARTBLOOD MATCHING
        // =====================================================

        List<DonorMatchingService.DonorMatchResult> matches =
                donorMatchingService.findBestDonors(
                        request
                );


        // =====================================================
        // SAVE ONLY NEW RECOMMENDATIONS
        // =====================================================

        List<DonorRequestResponse> recommendations =
                responseService.saveRecommendedDonors(
                        request,
                        matches
                );


        // =====================================================
        // LIMIT RESULTS FOR ESCALATION
        // =====================================================

        int maximumRecommendations;

        if (emergency) {

            maximumRecommendations = 10;

        } else {

            maximumRecommendations = 5;
        }


        int recommendationCount =
                Math.min(
                        recommendations.size(),
                        maximumRecommendations
                );


        // =====================================================
        // RESPONSE
        // =====================================================

        result.put(
                "status",
                emergency
                        ? "EMERGENCY_ESCALATION"
                        : "HIGH_PRIORITY"
        );

        result.put(
                "message",
                emergency
                        ? "Emergency donor escalation activated."
                        : "High-priority donor escalation activated."
        );

        result.put(
                "totalMatchedDonors",
                matches.size()
        );

        result.put(
                "newRecommendations",
                recommendationCount
        );

        result.put(
                "recommendations",
                recommendations
        );

        return result;
    }


    // =========================================================
    // GET ACCEPTED DONORS
    // =========================================================

    public List<DonorRequestResponse> getAcceptedDonors(
            Long requestId
    ) {

        return responseRepository
                .findByBloodRequestIdAndResponseOrderByMatchScoreDesc(
                        requestId,
                        "ACCEPTED"
                );
    }
}