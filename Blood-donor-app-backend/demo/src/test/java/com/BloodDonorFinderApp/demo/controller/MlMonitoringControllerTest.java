package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.service.MlPredictionService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

class MlMonitoringControllerTest {

    @Test
    void monitoringRequiresAuthentication() {
        MlMonitoringController controller =
                new MlMonitoringController(mock(MlPredictionService.class));

        var response = controller.monitoring(null);

        assertEquals(401, response.getStatusCode().value());
    }
}
