package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.service.EmergencyEscalationService;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class EmergencyEscalationControllerTest {

    @Test
    void coordinatorRejectsNonOwner() {
        BloodRequestRepository requests = mock(BloodRequestRepository.class);
        EmergencyEscalationService service = mock(EmergencyEscalationService.class);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("intruder@example.com");
        when(requests.findById(42L)).thenReturn(java.util.Optional.empty());

        EmergencyEscalationController controller =
                new EmergencyEscalationController(service, requests);

        var response = controller.coordinate(42L, authentication);

        assertEquals(400, response.getStatusCode().value());
        verifyNoInteractions(service);
    }
}
