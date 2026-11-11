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
                return heuristicFallback("empty response",
                        bloodCompatible, distance, available, eligible,
                        verified, totalDonations, responseRate,
                        acceptanceRate, urgencyScore);
            }

            Object probability = response.get("response_probability");
            if (!(probability instanceof Number)) {
                return heuristicFallback("missing response probability",
                        bloodCompatible, distance, available, eligible,
                        verified, totalDonations, responseRate,
                        acceptanceRate, urgencyScore);
            }

            double value = ((Number) probability).doubleValue();
            if (!Double.isFinite(value) || value < 0.0 || value > 1.0) {
                return heuristicFallback("invalid response probability",
                        bloodCompatible, distance, available, eligible,
                        verified, totalDonations, responseRate,
                        acceptanceRate, urgencyScore);
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
            log.warn("SmartBlood ML service unavailable (RestClient error); " +
                     "using heuristic fallback", exception);
            return heuristicFallback("service unavailable (RestClient)",
                    bloodCompatible, distance, available, eligible,
                    verified, totalDonations, responseRate,
                    acceptanceRate, urgencyScore);
        } catch (Exception exception) {
            // Catch-all for unexpected errors (connection refused wrapped in
            // non-RestClient exceptions, JSON parse errors, etc.)
            log.warn("SmartBlood ML service call failed unexpectedly; " +
                     "using heuristic fallback", exception);
            return heuristicFallback("unexpected error: " + exception.getMessage(),
                    bloodCompatible, distance, available, eligible,
                    verified, totalDonations, responseRate,
                    acceptanceRate, urgencyScore);
        } finally {
            totalLatencyNanos.addAndGet(System.nanoTime() - started);
        }
    }

    /**
     * Computes a realistic heuristic score when the FastAPI ML service is
     * unreachable. Weights are chosen to approximate the random-forest model's
     * feature importances from training analysis.
     *
     * <p>Factors considered (in order of weight):
     * <ul>
     *   <li>Blood compatibility — hard gate (incompatible → 5%)</li>
     *   <li>Distance — closer is much better</li>
     *   <li>Availability &amp; eligibility — binary gates</li>
     *   <li>Historical acceptance rate — strong signal</li>
     *   <li>Verification status — mild trust boost</li>
     *   <li>Donation history — experienced donors respond more</li>
     *   <li>Urgency — high urgency slightly increases response</li>
     * </ul>
     */
    private PredictionResult heuristicFallback(
            String reason,
            int bloodCompatible,
            double distance,
            int available,
            int eligible,
            int verified,
            int totalDonations,
            double responseRate,
            double acceptanceRate,
            double urgencyScore
    ) {
        failedPredictions.incrementAndGet();
        fallbackPredictions.incrementAndGet();
        log.warn("SmartBlood ML prediction unavailable: {}; computing heuristic fallback", reason);

        // ── Hard gate: incompatible blood → very low probability ──
        if (bloodCompatible == 0) {
            return new PredictionResult(5.0, false, "heuristic-v1", "HEURISTIC_FALLBACK");
        }

        // ── Unavailable or ineligible → low probability ──
        if (available == 0) {
            return new PredictionResult(8.0, false, "heuristic-v1", "HEURISTIC_FALLBACK");
        }
        if (eligible == 0) {
            return new PredictionResult(10.0, false, "heuristic-v1", "HEURISTIC_FALLBACK");
        }

        // ── Base score: start at 55% for a compatible, available, eligible donor ──
        double score = 55.0;

        // ── Distance factor (max ±20 points) ──
        // Donors within 5 km get full bonus; penalty ramps up past 20 km
        if (distance <= 5.0) {
            score += 20.0;
        } else if (distance <= 15.0) {
            score += 20.0 - (distance - 5.0) * 1.5;   // linear decay
        } else if (distance <= 50.0) {
            score += 5.0 - (distance - 15.0) * 0.4;    // slower decay
        } else {
            score -= Math.min(15.0, (distance - 50.0) * 0.2);
        }

        // ── Historical acceptance rate (max +15 points) ──
        // acceptanceRate comes in as 0-100 percentage
        score += (acceptanceRate / 100.0) * 15.0;

        // ── Historical response rate (max +5 points) ──
        score += (responseRate / 100.0) * 5.0;

        // ── Verified donor bonus (+5 points) ──
        if (verified == 1) {
            score += 5.0;
        }

        // ── Donation experience (max +5 points) ──
        // Diminishing returns: 1 donation = +1.7, 3+ donations = +5
        score += Math.min(5.0, totalDonations * 1.7);

        // ── Urgency bump (max +5 points) ──
        // urgencyScore is typically 0.0 – 1.0
        score += urgencyScore * 5.0;

        // ── Clamp to [1, 99] — never show 0% or 100% for a heuristic ──
        score = Math.max(1.0, Math.min(99.0, score));

        // Round to one decimal
        score = Math.round(score * 10.0) / 10.0;

        return new PredictionResult(score, false, "heuristic-v1", "HEURISTIC_FALLBACK");
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
