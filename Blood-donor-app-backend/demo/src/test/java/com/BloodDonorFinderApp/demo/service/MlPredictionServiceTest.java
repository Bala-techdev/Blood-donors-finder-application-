package com.BloodDonorFinderApp.demo.service;

import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MlPredictionServiceTest {

    private final RestTemplate restTemplate = mock(RestTemplate.class);
    private final MlPredictionService service =
            new MlPredictionService(restTemplate, "http://ml.test/predict");

    @Test
    void convertsValidatedProbabilityToPercentage() {
        when(restTemplate.postForObject(
                eq("http://ml.test/predict"), any(), eq(Map.class)
        )).thenReturn(Map.of(
                "response_probability", 0.73,
                "model_version", "test-v1",
                "prediction_status", "MODEL_PREDICTED"
        ));

        assertEquals(73.0, service.predictResponseProbability(
                1, 4.0, 1, 1, 0,
                2, 3, 2, 1, 100.0, 66.7, 75.0
        ));
    }

    @Test
    void usesNeutralFallbackWhenMlServiceFails() {
        when(restTemplate.postForObject(
                eq("http://ml.test/predict"), any(), eq(Map.class)
        )).thenThrow(new RestClientException("connection refused"));

        assertEquals(50.0, service.predictResponseProbability(
                1, 4.0, 1, 1, 0,
                2, 3, 2, 1, 100.0, 66.7, 75.0
        ));
    }

    @Test
    void usesNeutralFallbackForInvalidModelResponse() {
        when(restTemplate.postForObject(
                eq("http://ml.test/predict"), any(), eq(Map.class)
        )).thenReturn(Map.of("response_probability", 1.5));

        assertEquals(50.0, service.predictResponseProbability(
                1, 4.0, 1, 1, 0,
                2, 3, 2, 1, 100.0, 66.7, 75.0
        ));
    }

    @Test
    void recordsLiveRequestsFailuresFallbacksAndLatency() {
        when(restTemplate.postForObject(
                eq("http://ml.test/predict"), any(), eq(Map.class)
        )).thenThrow(new RestClientException("connection refused"));

        service.predictResponseProbability(
                1, 4.0, 1, 1, 0, 2, 3, 2, 1, 100.0, 66.7, 75.0
        );

        var snapshot = service.monitoringSnapshot();
        assertEquals(1, snapshot.predictionRequests());
        assertEquals(0, snapshot.successfulPredictions());
        assertEquals(1, snapshot.failedPredictions());
        assertEquals(1, snapshot.fallbackPredictions());
        assertTrue(snapshot.averageLatencyMs() >= 0);
        assertEquals(0.9912, snapshot.offlineEvaluationMetrics().get("f1"));
    }
}
