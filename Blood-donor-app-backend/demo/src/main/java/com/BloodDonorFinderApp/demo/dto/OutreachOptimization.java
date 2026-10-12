package com.BloodDonorFinderApp.demo.dto;

import java.util.List;

public record OutreachOptimization(
        Long requestId,
        String requestStatus,
        long remainingUnits,
        int recommendedDonorCount,
        Double aggregateResponseLikelihood,
        boolean aggregateUsesIndependenceAssumption,
        List<String> warnings,
        List<RecommendedDonor> donors
) {
    public record RecommendedDonor(
            Long donorId,
            String donorName,
            String bloodGroup,
            String location,
            double distanceKm,
            double score,
            double responseProbability,
            boolean responsePredictionAvailable,
            List<String> reasons
    ) {
    }
}
