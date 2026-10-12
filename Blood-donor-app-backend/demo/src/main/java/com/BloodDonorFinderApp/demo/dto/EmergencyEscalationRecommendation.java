package com.BloodDonorFinderApp.demo.dto;

import java.util.List;

public record EmergencyEscalationRecommendation(
        Long requestId,
        String status,
        String recommendedAction,
        String urgency,
        long elapsedMinutes,
        long requiredUnits,
        long acceptedResponses,
        long pendingResponses,
        long eligibleAvailableMatches,
        boolean mandatoryEscalation,
        List<String> reasons
) {
}
