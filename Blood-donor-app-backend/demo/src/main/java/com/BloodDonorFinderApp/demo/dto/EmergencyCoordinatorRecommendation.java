package com.BloodDonorFinderApp.demo.dto;

import java.util.List;
import java.util.Map;

public record EmergencyCoordinatorRecommendation(
        Long requestId,
        String status,
        String urgency,
        String recommendedAction,
        boolean mandatory,
        long elapsedMinutes,
        long requiredUnits,
        long acceptedResponses,
        long outstandingResponses,
        long eligibleAvailableDonors,
        long recentEscalations,
        boolean mlPredictionsUsed,
        List<String> reasons,
        List<String> missingData,
        Map<String, Object> evidence
) {
}
