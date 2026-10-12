package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.repository.DonorRequestResponseRepository;
import com.BloodDonorFinderApp.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BloodRequestServiceTest {

    private BloodRequestRepository bloodRequestRepository;
    private DonorRequestResponseRepository responseRepository;
    private DonorMatchingService donorMatchingService;
    private DonorRequestResponseService donorRequestResponseService;
    private UserRepository userRepository;
    private BloodRequestService service;

    @BeforeEach
    void setUp() {
        bloodRequestRepository = mock(BloodRequestRepository.class);
        responseRepository = mock(DonorRequestResponseRepository.class);
        donorMatchingService = mock(DonorMatchingService.class);
        donorRequestResponseService = mock(DonorRequestResponseService.class);
        userRepository = mock(UserRepository.class);
        service = new BloodRequestService(
                bloodRequestRepository,
                responseRepository,
                donorMatchingService,
                donorRequestResponseService,
                userRepository
        );
    }

    @Test
    void createRequest_validatesAndIgnoresClientLifecycleFields() {
        User user = user("owner@example.com", 1L);
        BloodRequest request = validRequest();
        request.setId(55L);
        request.setStatus("FULFILLED");

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(bloodRequestRepository.save(request)).thenReturn(request);
        when(donorMatchingService.findBestDonors(request)).thenReturn(java.util.List.of());

        BloodRequest saved = service.createRequest(request, user.getEmail());

        assertSame(user, saved.getRequester());
        assertEquals("O+", saved.getBloodGroup());
        assertEquals("URGENT", saved.getUrgency());
        assertEquals("PENDING", saved.getStatus());
        assertNull(saved.getFulfilledAt());
        assertNull(saved.getId());
        verify(bloodRequestRepository).save(request);
    }

    @Test
    void createRequest_rejectsInvalidInputBeforePersistence() {
        BloodRequest request = validRequest();
        request.setBloodGroup("X+");
        request.setUnits(0);
        request.setRequiredDate(LocalDate.now().minusDays(1));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> service.createRequest(request, "owner@example.com")
        );

        assertEquals("Invalid blood group", exception.getMessage());
        verifyNoInteractions(userRepository, bloodRequestRepository);
    }

    @Test
    void updateStatus_rejectsUnauthorizedOwner() {
        BloodRequest request = validRequest();
        request.setStatus("PENDING");
        request.setRequester(user("owner@example.com", 1L));
        User otherUser = user("other@example.com", 2L);

        when(bloodRequestRepository.findById(4L)).thenReturn(Optional.of(request));
        when(userRepository.findByEmail(otherUser.getEmail()))
                .thenReturn(Optional.of(otherUser));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> service.updateStatus(4L, "CANCELLED", otherUser.getEmail())
        );

        assertTrue(exception.getMessage().contains("not allowed"));
        verify(bloodRequestRepository, never()).save(any());
    }

    @Test
    void updateStatus_rejectsTransitionsFromTerminalStates() {
        BloodRequest request = validRequest();
        request.setStatus("CANCELLED");
        request.setRequester(user("owner@example.com", 1L));

        when(bloodRequestRepository.findById(4L)).thenReturn(Optional.of(request));
        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(request.getRequester()));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> service.updateStatus(4L, "PENDING", "owner@example.com")
        );

        assertTrue(exception.getMessage().contains("cannot change status"));
        verify(bloodRequestRepository, never()).save(any());
    }

    @Test
    void updateStatus_setsFulfilledTimestampForFulfillment() {
        BloodRequest request = validRequest();
        request.setStatus("PENDING");
        request.setRequester(user("owner@example.com", 1L));

        when(bloodRequestRepository.findById(4L)).thenReturn(Optional.of(request));
        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(request.getRequester()));
        when(bloodRequestRepository.save(request)).thenReturn(request);

        BloodRequest saved = service.updateStatus(
                4L,
                "FULFILLED",
                "owner@example.com"
        );

        assertEquals("FULFILLED", saved.getStatus());
        assertNotNull(saved.getFulfilledAt());
    }

    @Test
    void checkAndUpdateFulfillment_doesNotReopenCancelledRequest() {
        BloodRequest request = validRequest();
        request.setId(7L);
        request.setStatus("CANCELLED");

        when(bloodRequestRepository.findById(7L)).thenReturn(Optional.of(request));

        BloodRequest result = service.checkAndUpdateFulfillment(7L);

        assertSame(request, result);
        assertEquals("CANCELLED", result.getStatus());
        verifyNoInteractions(responseRepository);
        verify(bloodRequestRepository, never()).save(any());
    }

    @Test
    void checkAndUpdateFulfillment_doesNotFulfillAcceptedResponses() {
        BloodRequest request = validRequest();
        request.setId(8L);
        request.setStatus("PENDING");
        request.setUnits(1);

        when(bloodRequestRepository.findById(8L)).thenReturn(Optional.of(request));

        BloodRequest result = service.checkAndUpdateFulfillment(8L);

        assertSame(request, result);
        assertEquals("PENDING", result.getStatus());
        assertNull(result.getFulfilledAt());
        verifyNoInteractions(responseRepository);
        verify(bloodRequestRepository, never()).save(any());
    }

    private BloodRequest validRequest() {
        BloodRequest request = new BloodRequest();
        request.setPatientName("Patient");
        request.setBloodGroup(" o+ ");
        request.setUnits(2);
        request.setHospitalName("Hospital");
        request.setLocation("Nairobi");
        request.setUrgency(" urgent ");
        request.setRequiredDate(LocalDate.now());
        request.setDescription("Need blood");
        return request;
    }

    private User user(String email, Long id) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        return user;
    }
}
