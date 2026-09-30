package com.BloodDonorFinderApp.demo.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class MlPredictionService {

    private final RestTemplate restTemplate;

    private static final String ML_URL =
            "http://localhost:8000/predict";


    public MlPredictionService(
            RestTemplate restTemplate
    ) {
        this.restTemplate = restTemplate;
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

        // =====================================================
        // CREATE ML REQUEST
        // =====================================================

        Map<String, Object> request =
                new HashMap<>();


        request.put(
                "blood_compatible",
                bloodCompatible
        );

        request.put(
                "distance_km",
                distance
        );

        request.put(
                "available",
                available
        );

        request.put(
                "eligible",
                eligible
        );

        request.put(
                "verified",
                verified
        );

        request.put(
                "total_donations",
                totalDonations
        );

        request.put(
                "previous_recommendations",
                previousRecommendations
        );

        request.put(
                "previous_acceptances",
                previousAcceptances
        );

        request.put(
                "previous_declines",
                previousDeclines
        );

        request.put(
                "response_rate",
                responseRate
        );

        request.put(
                "acceptance_rate",
                acceptanceRate
        );

        request.put(
                "urgency_score",
                urgencyScore
        );


        // =====================================================
        // CALL FASTAPI ML SERVICE
        // =====================================================

        try {

            Map<String, Object> response =
                    restTemplate.postForObject(
                            ML_URL,
                            request,
                            Map.class
                    );


            // =================================================
            // CHECK RESPONSE
            // =================================================

            if (response == null ||
                    response.get(
                            "response_percentage"
                    ) == null) {

                System.out.println(
                        "ML service returned empty response."
                );

                return 50.0;
            }


            // =================================================
            // GET ML RESPONSE PROBABILITY
            // =================================================

            return ((Number)
                    response.get(
                            "response_percentage"
                    )).doubleValue();


        } catch (Exception e) {

            // =================================================
            // FALLBACK
            // =================================================

            System.out.println(
                    "ML service unavailable: "
                            + e.getMessage()
            );

            /*
             * If FastAPI is not running,
             * donor matching should still work.
             *
             * 50% is used as neutral fallback.
             */

            return 50.0;
        }
    }
}