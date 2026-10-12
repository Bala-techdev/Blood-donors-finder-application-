package com.BloodDonorFinderApp.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class MlPredictionService {

    private static final Logger log =
            LoggerFactory.getLogger(MlPredictionService.class);

    private final RestTemplate restTemplate;
    private final String mlUrl;
    private final AtomicLong predictionRequests = new AtomicLong();
    private final AtomicLong successfulPredictions = new AtomicLong();
    private final AtomicLong failedPredictions = new AtomicLong();
    private final AtomicLong fallbackPredictions = new AtomicLong();
    private final AtomicLong totalLatencyNanos = new AtomicLong();

    public MlPredictionService(
            RestTemplate restTemplate,
            @Value("${app.ml.url:http://localhost:8000/predict}") String mlUrl
    ) {
        this.restTemplate = restTemplate;
        this.mlUrl = mlUrl;
    }

    public MlMonitoringSnapshot monitoringSnapshot() {
        long requests = predictionRequests.get();
        return new MlMonitoringSnapshot(
                "SmartBlood donor response classifier",
                successfulPredictions.get() > 0 ? "available" : "unknown",
                requests,
                successfulPredictions.get(),
                failedPredictions.get(),
                fallbackPredictions.get(),
                requests == 0 ? 0.0 : totalLatencyNanos.get() / 1_000_000.0 / requests,
                "response-rf-calibrated-v1",
                Map.of(
                        "precision", 0.9850,
                        "recall", 0.9975,
                        "f1", 0.9912,
                        "rocAuc", 0.9653,
                        "brierScore", 0.0141
                ),
                "Offline holdout metrics from the synthetic demonstration dataset; not live accuracy.",
                List.of(
                        "Training data is synthetic and severely imbalanced.",
                        "Live predictions have no ground-truth outcomes yet.",
                        "Response-time estimation has insufficient timestamp data."
                )
        );
    }

    public double predictResponseProbability(
            int bloodCompatible,
            double distance,
            int available,
            int eligible,
            int verified,
            int totalDonations,
            int previousRecommendations,
            int previousAcceptances,
            int previousDeclines,
            double responseRate,
            double acceptanceRate,
            double urgencyScore
    ) {
        return predictResponse(
                bloodCompatible, distance, available, eligible, verified,
                totalDonations, previousRecommendations, previousAcceptances,
                previousDeclines, responseRate, acceptanceRate, urgencyScore
        ).probabilityPercentage();
    }

    public PredictionResult predictResponse(
            int bloodCompatible,
            double distance,
            int available,
            int eligible,
            int verified,
            int totalDonations,
            int previousRecommendations,
            int previousAcceptances,
            int previousDeclines,
            double responseRate,
            double acceptanceRate,
            double urgencyScore
    ) {
        long started = System.nanoTime();
        predictionRequests.incrementAndGet();
        Map<String, Object> request = new HashMap<>();
        request.put("blood_compatible", bloodCompatible);
        request.put("distance_km", distance);
        request.put("available", available);
        request.put("eligible", eligible);
        request.put("verified", verified);
        request.put("total_donations", totalDonations);
        request.put("previous_recommendations", previousRecommendations);
        request.put("previous_acceptances", previousAcceptances);
        request.put("previous_declines", previousDeclines);
        request.put("response_rate", responseRate / 100.0);
        request.put("acceptance_rate", acceptanceRate / 100.0);
        request.put("urgency_score", urgencyScore);

        try {
            Map<?, ?> response =
                    restTemplate.postForObject(mlUrl, request, Map.class);

            if (response == null) {
                return fallback("empty response");
            }

            Object probability = response.get("response_probability");
            if (!(probability instanceof Number)) {
                return fallback("missing response probability");
            }

            double value = ((Number) probability).doubleValue();
            if (!Double.isFinite(value) || value < 0.0 || value > 1.0) {
                return fallback("invalid response probability");
            }
            String modelVersion = response.get("model_version") instanceof String version
                    ? version
                    : "unknown";
            successfulPredictions.incrementAndGet();
            return new PredictionResult(
                    value * 100.0,
                    true,
                    modelVersion,
                    response.get("prediction_status") instanceof String status
                            ? status
                            : "MODEL_PREDICTED"
            );
        } catch (RestClientException exception) {
            log.warn("SmartBlood ML service unavailable; using neutral fallback", exception);
            return fallback("service unavailable");
        } finally {
            totalLatencyNanos.addAndGet(System.nanoTime() - started);
        }
    }

    private PredictionResult fallback(String reason) {
        failedPredictions.incrementAndGet();
        fallbackPredictions.incrementAndGet();
        log.warn("SmartBlood ML prediction unavailable: {}; using neutral fallback", reason);
        return new PredictionResult(50.0, false, "unavailable", "FALLBACK");
    }

    public record MlMonitoringSnapshot(
            String modelName,
            String availability,
            long predictionRequests,
            long successfulPredictions,
            long failedPredictions,
            long fallbackPredictions,
            double averageLatencyMs,
            String modelVersion,
            Map<String, Double> offlineEvaluationMetrics,
            String evaluationNotice,
            List<String> dataQualityWarnings
    ) {
    }

    public record PredictionResult(
            double probabilityPercentage,
            boolean modelAvailable,
            String modelVersion,
            String status
    ) {
    }
}
