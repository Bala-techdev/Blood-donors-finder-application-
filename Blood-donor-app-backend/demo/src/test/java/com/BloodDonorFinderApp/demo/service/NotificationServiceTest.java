package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.Notification;
import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.repository.NotificationRepository;
import com.BloodDonorFinderApp.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class NotificationServiceTest {

    private NotificationRepository notificationRepository;
    private UserRepository userRepository;
    private NotificationService service;

    @BeforeEach
    void setUp() {
        notificationRepository = mock(NotificationRepository.class);
        userRepository = mock(UserRepository.class);
        service = new NotificationService(
                notificationRepository,
                userRepository
        );
    }

    @Test
    void returnsExistingNotificationInsteadOfCreatingDuplicate() {
        User user = user(1L, "owner@example.com");
        Notification existing = notification("DONOR_ACCEPTED", 42L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(notificationRepository
                .existsByUserIdAndTypeAndRequestId(
                        1L, "DONOR_ACCEPTED", 42L))
                .thenReturn(true);
        when(notificationRepository
                .findFirstByUserIdAndTypeAndRequestIdOrderByCreatedAtDesc(
                        1L, "DONOR_ACCEPTED", 42L))
                .thenReturn(Optional.of(existing));

        Notification result = service.createNotification(
                1L,
                "DONOR_ACCEPTED",
                "Accepted",
                "A donor accepted your request.",
                42L
        );

        assertSame(existing, result);
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void rejectsReadAccessToAnotherUsersNotification() {
        User owner = user(1L, "owner@example.com");
        Notification notification = notification("DONOR_ACCEPTED", 42L);
        notification.setUser(owner);

        when(notificationRepository.findById(7L))
                .thenReturn(Optional.of(notification));

        assertThrows(
                RuntimeException.class,
                () -> service.markAsRead(7L, "other@example.com")
        );

        verify(notificationRepository, never()).save(any());
    }

    private User user(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        return user;
    }

    private Notification notification(String type, Long requestId) {
        Notification notification = new Notification();
        notification.setType(type);
        notification.setRequestId(requestId);
        return notification;
    }
}
