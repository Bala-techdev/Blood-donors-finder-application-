package com.BloodDonorFinderApp.demo.dto;

import java.util.List;

public record BloodShortageRisk(
        String status,
        String assessmentType,
        String targetDefinition,
        boolean predictiveModelAvailable,
        List<RiskIndicator> indicators
) {
    public record RiskIndicator(
            String bloodGroup,
            String location,
            String riskLevel,
            long historicalRequests,
            long recentRequests,
            long unresolvedRequests,
            long availableEligibleCompatibleDonors,
            boolean locationDataComplete,
            List<String> reasons
    ) {
    }
}
