package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.service.OutreachOptimizationService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

class OutreachOptimizationControllerTest {

    @Test
    void recommendationsRequireAuthentication() {
        OutreachOptimizationController controller =
                new OutreachOptimizationController(mock(OutreachOptimizationService.class));

        var response = controller.recommendations(1L, null);

        assertEquals(401, response.getStatusCode().value());
    }
}
