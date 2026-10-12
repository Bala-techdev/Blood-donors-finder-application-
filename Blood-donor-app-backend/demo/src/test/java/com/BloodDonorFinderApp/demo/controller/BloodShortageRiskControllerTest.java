package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.service.BloodShortageRiskService;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class BloodShortageRiskControllerTest {

    @Test
    void rejectsUnauthenticatedAnalyticsAccess() {
        var service = mock(BloodShortageRiskService.class);
        var controller = new BloodShortageRiskController(service);

        var response = controller.getShortageRisk(null);

        assertEquals(401, response.getStatusCode().value());
        verifyNoInteractions(service);
    }

    @Test
    void permitsAuthenticatedAnalyticsAccess() {
        var service = mock(BloodShortageRiskService.class);
        var controller = new BloodShortageRiskController(service);
        Authentication authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);

        var response = controller.getShortageRisk(authentication);

        assertEquals(200, response.getStatusCode().value());
        verify(service).assess();
    }
}
