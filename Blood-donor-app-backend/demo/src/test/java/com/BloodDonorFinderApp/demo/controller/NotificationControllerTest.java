package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.entity.Notification;
import com.BloodDonorFinderApp.demo.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.core.Authentication;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class NotificationControllerTest {

    @Test
    void paginatedNotificationsUseAuthenticatedUser() {
        NotificationService service = mock(NotificationService.class);
        NotificationController controller = new NotificationController(service);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("owner@example.com");
        when(service.getUserNotificationsByEmail(
                eq("owner@example.com"),
                any()
        )).thenReturn(new PageImpl<>(List.of(new Notification())));

        var response = controller.getMyNotificationsPage(
                authentication,
                1,
                10
        );

        assertEquals(200, response.getStatusCode().value());
        assertEquals(1, response.getBody().getTotalElements());
        verify(service).getUserNotificationsByEmail(
                eq("owner@example.com"),
                any()
        );
    }

    @Test
    void rejectsInvalidPageSize() {
        NotificationController controller =
                new NotificationController(mock(NotificationService.class));

        assertThrows(
                IllegalArgumentException.class,
                () -> controller.getMyNotificationsPage(
                        mock(Authentication.class),
                        0,
                        101
                )
        );
    }
}
