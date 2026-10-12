package com.BloodDonorFinderApp.demo.dto;

import java.util.List;

public record DemandForecast(
        String status,
        String interval,
        String demandDefinition,
        boolean dataSufficient,
        int historyMonths,
        List<DemandPoint> actualDemand,
        List<DemandPrediction> forecasts,
        ForecastEvaluation evaluation
) {
    public record DemandPoint(
            String period,
            String bloodGroup,
            long requestCount
    ) {
    }

    public record DemandPrediction(
            String period,
            String bloodGroup,
            double predictedRequestCount,
            String method
    ) {
    }

    public record ForecastEvaluation(
            String testPeriod,
            double recentAverageMae,
            double previousMonthBaselineMae,
            String note
    ) {
    }
}
