package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DashboardServiceTest {

    private UserRepository userRepository;
    private DonorProfileRepository donorProfileRepository;
    private BloodRequestRepository bloodRequestRepository;
    private DonorRequestResponseRepository responseRepository;
    private NotificationRepository notificationRepository;
    private DashboardService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        donorProfileRepository = mock(DonorProfileRepository.class);
        bloodRequestRepository = mock(BloodRequestRepository.class);
        responseRepository = mock(DonorRequestResponseRepository.class);
        notificationRepository = mock(NotificationRepository.class);
        service = new DashboardService(
                userRepository,
                donorProfileRepository,
                bloodRequestRepository,
                responseRepository,
                notificationRepository
        );
    }

    @Test
    void calculatesUserScopedCountsWithoutDuplicatingResponses() {
        User user = new User();
        user.setId(7L);
        user.setEmail("owner@example.com");
        DonorProfile profile = new DonorProfile();
        profile.setId(9L);
        profile.setUser(user);
        profile.setBloodGroup("O+");
        profile.setLocation("City");
        profile.setDateOfBirth(java.time.LocalDate.of(1990, 1, 1));
        profile.setLatitude(1.0);
        profile.setLongitude(2.0);

        var pending = new com.BloodDonorFinderApp.demo.entity.BloodRequest();
        pending.setStatus("PENDING");
        var fulfilled = new com.BloodDonorFinderApp.demo.entity.BloodRequest();
        fulfilled.setStatus("FULFILLED");

        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(user));
        when(bloodRequestRepository.findByRequesterId(7L))
                .thenReturn(List.of(pending, fulfilled));
        when(donorProfileRepository.findByUserId(7L))
                .thenReturn(Optional.of(profile));
        when(responseRepository.countByDonorIdAndResponse(9L, "ACCEPTED"))
                .thenReturn(2L);
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(
                eq(7L), any()
        )).thenReturn(new PageImpl<>(List.of()));
        when(notificationRepository.countByUserIdAndReadFalse(7L))
                .thenReturn(1L);

        var stats = service.getStats("owner@example.com");

        assertEquals(2, stats.totalRequests());
        assertEquals(1, stats.pendingRequests());
        assertEquals(1, stats.fulfilledRequests());
        assertEquals(2, stats.acceptedResponses());
        assertEquals(100, stats.profileCompletionPercent());
        assertEquals(1, stats.unreadNotifications());
        verify(responseRepository).countByDonorIdAndResponse(9L, "ACCEPTED");
    }
}
