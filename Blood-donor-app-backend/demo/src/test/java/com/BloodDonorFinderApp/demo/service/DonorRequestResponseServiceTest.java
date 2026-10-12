package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.dto.AcceptedDonorDTO;
import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import com.BloodDonorFinderApp.demo.entity.DonorRequestResponse;
import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.repository.DonorProfileRepository;
import com.BloodDonorFinderApp.demo.repository.DonorRequestResponseRepository;
import com.BloodDonorFinderApp.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DonorRequestResponseServiceTest {

    private DonorRequestResponseRepository responseRepository;
    private BloodRequestRepository bloodRequestRepository;
    private DonorProfileRepository donorProfileRepository;
    private NotificationService notificationService;
    private UserRepository userRepository;
    private DonorMatchingService donorMatchingService;

    private DonorRequestResponseService service;

    @BeforeEach
    void setUp() {
        responseRepository = mock(DonorRequestResponseRepository.class);
        bloodRequestRepository = mock(BloodRequestRepository.class);
        donorProfileRepository = mock(DonorProfileRepository.class);
        notificationService = mock(NotificationService.class);
        userRepository = mock(UserRepository.class);
        donorMatchingService = mock(DonorMatchingService.class);

        service = new DonorRequestResponseService(
                responseRepository,
                bloodRequestRepository,
                donorProfileRepository,
                notificationService,
                userRepository,
                donorMatchingService
        );
    }

    @Test
    void respondToRequest_rejectsDuplicateAcceptedResponse() {
        Long requestId = 10L;
        Long userId = 2L;
        Long donorId = 20L;

        BloodRequest request = new BloodRequest();
        request.setId(requestId);
        request.setStatus("PENDING");

        User user = new User();
        user.setId(userId);
        user.setEmail("donor@example.com");

        DonorProfile donor = new DonorProfile();
        donor.setId(donorId);
        donor.setUser(user);
        donor.setAvailable(true);

        DonorRequestResponse existing = new DonorRequestResponse();
        existing.setBloodRequest(request);
        existing.setDonor(donor);
        existing.setResponse("ACCEPTED");

        when(bloodRequestRepository.findById(requestId)).thenReturn(Optional.of(request));
        when(userRepository.findByEmail("donor@example.com")).thenReturn(Optional.of(user));
        when(donorProfileRepository.findByUserId(userId)).thenReturn(Optional.of(donor));
        when(responseRepository.findByBloodRequestIdAndDonorId(requestId, donorId)).thenReturn(Optional.of(existing));

        Executable action = () -> service.respondToRequest(requestId, "donor@example.com");

        RuntimeException exception = assertThrows(RuntimeException.class, action);
        assertTrue(exception.getMessage().contains("already accepted"));
    }

    @Test
    void respondToRequest_rejectsRequesterRespondingToOwnRequest() {
        Long requestId = 12L;
        Long userId = 3L;

        User user = new User();
        user.setId(userId);
        user.setEmail("owner@example.com");

        BloodRequest request = new BloodRequest();
        request.setId(requestId);
        request.setStatus("PENDING");
        request.setRequester(user);

        DonorProfile donor = new DonorProfile();
        donor.setId(30L);
        donor.setUser(user);
        donor.setAvailable(true);

        when(bloodRequestRepository.findById(requestId)).thenReturn(Optional.of(request));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(donorProfileRepository.findByUserId(userId)).thenReturn(Optional.of(donor));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> service.respondToRequest(requestId, user.getEmail())
        );

        assertTrue(exception.getMessage().contains("own blood request"));
        verify(responseRepository, never()).save(any());
    }

    @Test
    void getResponsesForRequest_rejectsUnauthorizedUser() {
        Long requestId = 11L;
        Long requesterId = 99L;
        Long otherUserId = 44L;

        BloodRequest request = new BloodRequest();
        request.setId(requestId);
        User owner = new User();
        owner.setId(requesterId);
        request.setRequester(owner);

        User currentUser = new User();
        currentUser.setId(otherUserId);
        currentUser.setEmail("donor@example.com");

        when(bloodRequestRepository.findById(requestId)).thenReturn(Optional.of(request));
        when(userRepository.findByEmail("donor@example.com")).thenReturn(Optional.of(currentUser));
        when(donorProfileRepository.findByUserId(otherUserId)).thenReturn(Optional.empty());

        Executable action = () -> service.getResponsesForRequest(requestId, "donor@example.com");

        RuntimeException exception = assertThrows(RuntimeException.class, action);
        assertTrue(exception.getMessage().contains("not authorized"));
    }

    @Test
    void getResponsesForRequest_returnsOnlyDonorsOwnResponse() {
        Long requestId = 13L;
        Long ownerId = 50L;
        Long donorUserId = 60L;
        Long donorId = 70L;

        User owner = new User();
        owner.setId(ownerId);
        owner.setEmail("owner@example.com");

        User donorUser = new User();
        donorUser.setId(donorUserId);
        donorUser.setEmail("donor@example.com");

        BloodRequest request = new BloodRequest();
        request.setId(requestId);
        request.setRequester(owner);

        DonorProfile donor = new DonorProfile();
        donor.setId(donorId);
        donor.setUser(donorUser);

        DonorRequestResponse response = new DonorRequestResponse();
        response.setBloodRequest(request);
        response.setDonor(donor);
        response.setResponse("ACCEPTED");

        when(bloodRequestRepository.findById(requestId)).thenReturn(Optional.of(request));
        when(userRepository.findByEmail(donorUser.getEmail())).thenReturn(Optional.of(donorUser));
        when(donorProfileRepository.findByUserId(donorUserId)).thenReturn(Optional.of(donor));
        when(responseRepository.findByBloodRequestIdAndDonorId(requestId, donorId))
                .thenReturn(Optional.of(response));

        List<DonorRequestResponse> result =
                service.getResponsesForRequest(requestId, donorUser.getEmail());

        assertEquals(List.of(response), result);
        verify(responseRepository, never()).findByBloodRequestId(requestId);
    }

    @Test
    void respondToRequest_rejectsFulfilledRequest() {
        Long requestId = 14L;
        BloodRequest request = new BloodRequest();
        request.setId(requestId);
        request.setStatus("FULFILLED");

        when(bloodRequestRepository.findById(requestId)).thenReturn(Optional.of(request));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> service.respondToRequest(requestId, "donor@example.com")
        );

        assertTrue(exception.getMessage().contains("no longer accepting"));
        verifyNoInteractions(userRepository, responseRepository);
    }

    @Test
    void recommendDonor_rejectsNonOwner() {
        Long requestId = 15L;
        BloodRequest request = new BloodRequest();
        request.setId(requestId);
        User owner = new User();
        owner.setId(1L);
        owner.setEmail("owner@example.com");
        request.setRequester(owner);

        User otherUser = new User();
        otherUser.setId(2L);
        otherUser.setEmail("other@example.com");

        when(bloodRequestRepository.findById(requestId)).thenReturn(Optional.of(request));
        when(userRepository.findByEmail(otherUser.getEmail())).thenReturn(Optional.of(otherUser));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> service.recommendDonor(
                        requestId,
                        20L,
                        90.0,
                        2.0,
                        otherUser.getEmail()
                )
        );

        assertTrue(exception.getMessage().contains("not authorized"));
        verifyNoInteractions(donorProfileRepository, responseRepository);
    }

    @Test
    void getAcceptedDonorsForRequester_returnsOnlyAcceptedResponses() {
        Long requestId = 21L;
        Long requesterId = 7L;
        Long donorId = 8L;

        User requester = new User();
        requester.setId(requesterId);
        requester.setEmail("requester@example.com");

        BloodRequest request = new BloodRequest();
        request.setId(requestId);
        request.setRequester(requester);

        User donorUser = new User();
        donorUser.setId(10L);
        donorUser.setName("Ava");
        donorUser.setEmail("ava@example.com");
        donorUser.setPhone("111-111-1111");

        DonorProfile donor = new DonorProfile();
        donor.setId(donorId);
        donor.setUser(donorUser);
        donor.setBloodGroup("O+");
        donor.setLocation("Nairobi");
        donor.setAvailable(true);
        donor.setVerified(true);
        donor.setTotalDonations(3);

        DonorRequestResponse accepted = new DonorRequestResponse();
        accepted.setId(1L);
        accepted.setBloodRequest(request);
        accepted.setDonor(donor);
        accepted.setResponse("ACCEPTED");
        accepted.setRespondedAt(LocalDateTime.now());

        DonorRequestResponse declined = new DonorRequestResponse();
        declined.setId(2L);
        declined.setBloodRequest(request);
        declined.setDonor(donor);
        declined.setResponse("DECLINED");

        when(bloodRequestRepository.findById(requestId)).thenReturn(Optional.of(request));
        when(userRepository.findByEmail("requester@example.com")).thenReturn(Optional.of(requester));
        when(responseRepository.findByBloodRequestId(requestId)).thenReturn(List.of(accepted, declined));

        List<AcceptedDonorDTO> result = service.getAcceptedDonorsForRequester(requestId, "requester@example.com");

        assertEquals(1, result.size());
        assertEquals("ACCEPTED", result.get(0).getResponse());
        assertEquals("Ava", result.get(0).getName());
        assertEquals("ava@example.com", result.get(0).getEmail());
    }

    @Test
    void sanitizeDonorProfile_redactsPrivateUserDetails() {
        User donorUser = new User();
        donorUser.setId(33L);
        donorUser.setName("Ava");
        donorUser.setEmail("ava@example.com");
        donorUser.setPhone("111-111-1111");

        DonorProfile donor = new DonorProfile();
        donor.setId(8L);
        donor.setUser(donorUser);
        donor.setBloodGroup("O+");
        donor.setLocation("Nairobi");
        donor.setAvailable(true);
        donor.setVerified(true);

        DonorProfile sanitized = new DonorService(
                donorProfileRepository,
                userRepository
        ).sanitizeDonorProfile(donor);

        assertEquals("Ava", sanitized.getUser().getName());
        assertNull(sanitized.getUser().getEmail());
        assertNull(sanitized.getUser().getPhone());
        assertEquals("O+", sanitized.getBloodGroup());
        assertEquals("Nairobi", sanitized.getLocation());
    }
}
