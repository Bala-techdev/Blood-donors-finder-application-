package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.dto.DemandForecast;
import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class DemandForecastService {

    private static final int MINIMUM_HISTORY_MONTHS = 3;
    private static final int FORECAST_WINDOW_MONTHS = 3;

    private final BloodRequestRepository bloodRequestRepository;

    public DemandForecastService(BloodRequestRepository bloodRequestRepository) {
        this.bloodRequestRepository = bloodRequestRepository;
    }

    private long monthNumber(YearMonth month) {
        return month.getYear() * 12L + month.getMonthValue();
    }

    public DemandForecast getForecast() {
        TreeMap<YearMonth, Map<String, Long>> monthlyDemand =
                usableRequests()
                        .stream()
                        .collect(Collectors.groupingBy(
                                request -> YearMonth.from(request.getCreatedAt()),
                                TreeMap::new,
                                Collectors.groupingBy(
                                        request -> request.getBloodGroup().trim().toUpperCase(),
                                        TreeMap::new,
                                        Collectors.counting()
                                )
                        ));

        List<DemandForecast.DemandPoint> actual = monthlyDemand.entrySet()
                .stream()
                .flatMap(period -> period.getValue().entrySet().stream()
                        .map(group -> new DemandForecast.DemandPoint(
                                period.getKey().toString(),
                                group.getKey(),
                                group.getValue()
                        )))
                .toList();

        int historyMonths = monthlyDemand.isEmpty()
                ? 0
                : (int) (monthNumber(monthlyDemand.lastKey())
                - monthNumber(monthlyDemand.firstKey()) + 1);

        if (historyMonths < MINIMUM_HISTORY_MONTHS) {
            return new DemandForecast(
                    "DATA_INSUFFICIENT",
                    "calendar month",
                    "Count of distinct persisted blood requests by createdAt month and blood group.",
                    false,
                    historyMonths,
                    actual,
                    List.of(),
                    null
            );
        }

        YearMonth forecastPeriod = monthlyDemand.lastKey().plusMonths(1);
        List<String> groups = monthlyDemand.values()
                .stream()
                .flatMap(values -> values.keySet().stream())
                .distinct()
                .sorted()
                .toList();

        List<DemandForecast.DemandPrediction> forecasts = groups.stream()
                .map(group -> new DemandForecast.DemandPrediction(
                        forecastPeriod.toString(),
                        group,
                        averageForWindow(monthlyDemand, monthlyDemand.lastKey(), group),
                        "three-month recent average"
                ))
                .toList();

        return new DemandForecast(
                "FORECAST_AVAILABLE",
                "calendar month",
                "Count of distinct persisted blood requests by createdAt month and blood group.",
                true,
                historyMonths,
                actual,
                forecasts,
                evaluateLastMonth(monthlyDemand)
        );
    }

    private List<BloodRequest> usableRequests() {
        Map<Long, BloodRequest> uniqueRequests = new LinkedHashMap<>();
        for (BloodRequest request : bloodRequestRepository.findAll()) {
            if (request.getId() != null
                    && request.getCreatedAt() != null
                    && hasText(request.getBloodGroup())) {
                uniqueRequests.put(request.getId(), request);
            }
        }
        return uniqueRequests.values().stream().toList();
    }

    private double averageForWindow(
            TreeMap<YearMonth, Map<String, Long>> monthlyDemand,
            YearMonth end,
            String group
    ) {
        long total = 0;
        for (int offset = 1; offset <= FORECAST_WINDOW_MONTHS; offset++) {
            total += monthlyDemand
                    .getOrDefault(end.minusMonths(offset), Map.of())
                    .getOrDefault(group, 0L);
        }
        return round((double) total / FORECAST_WINDOW_MONTHS);
    }

    private DemandForecast.ForecastEvaluation evaluateLastMonth(
            TreeMap<YearMonth, Map<String, Long>> monthlyDemand
    ) {
        YearMonth testPeriod = monthlyDemand.lastKey();
        YearMonth trainEnd = testPeriod.minusMonths(1);
        List<String> groups = monthlyDemand.values()
                .stream()
                .flatMap(values -> values.keySet().stream())
                .distinct()
                .toList();

        double recentError = 0;
        double previousError = 0;
        for (String group : groups) {
            double actual = monthlyDemand
                    .getOrDefault(testPeriod, Map.of())
                    .getOrDefault(group, 0L);
            recentError += Math.abs(
                    averageForWindow(monthlyDemand, trainEnd, group) - actual
            );
            double previous = monthlyDemand
                    .getOrDefault(trainEnd, Map.of())
                    .getOrDefault(group, 0L);
            previousError += Math.abs(previous - actual);
        }

        double denominator = Math.max(1, groups.size());
        return new DemandForecast.ForecastEvaluation(
                testPeriod.toString(),
                round(recentError / denominator),
                round(previousError / denominator),
                "One chronological holdout month; request counts, not units or fulfilled demand."
        );
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
