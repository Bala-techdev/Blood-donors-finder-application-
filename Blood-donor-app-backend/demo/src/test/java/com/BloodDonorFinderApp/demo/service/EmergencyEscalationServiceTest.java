package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.repository.DonorRequestResponseRepository;
import com.BloodDonorFinderApp.demo.repository.EmergencyEscalationEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EmergencyEscalationServiceTest {

    private BloodRequestRepository requestRepository;
    private DonorRequestResponseRepository responseRepository;
    private DonorMatchingService donorMatchingService;
    private DonorRequestResponseService responseService;
    private EmergencyEscalationEventRepository eventRepository;
    private EmergencyEscalationService service;

    @BeforeEach
    void setUp() {
        requestRepository = mock(BloodRequestRepository.class);
        responseRepository = mock(DonorRequestResponseRepository.class);
        donorMatchingService = mock(DonorMatchingService.class);
        responseService = mock(DonorRequestResponseService.class);
        eventRepository = mock(EmergencyEscalationEventRepository.class);
        service = new EmergencyEscalationService(
                requestRepository,
                responseRepository,
                donorMatchingService,
                responseService,
                eventRepository,
                30
        );
    }

    @Test
    void doesNotEscalateCancelledRequest() {
        BloodRequest request = request(1L, "URGENT", "CANCELLED");
        when(requestRepository.findById(1L)).thenReturn(java.util.Optional.of(request));
        when(responseRepository.countByBloodRequestIdAndResponse(1L, "ACCEPTED"))
                .thenReturn(0L);

        Map<String, Object> result = service.escalateRequest(1L);

        assertEquals("CANCELLED", result.get("status"));
        verifyNoInteractions(donorMatchingService, responseService, eventRepository);
    }

    @Test
    void doesNotEscalateFulfilledRequest() {
        BloodRequest request = request(5L, "EMERGENCY", "FULFILLED");
        when(requestRepository.findById(5L)).thenReturn(java.util.Optional.of(request));
        when(responseRepository.countByBloodRequestIdAndResponse(5L, "ACCEPTED"))
                .thenReturn(0L);

        Map<String, Object> result = service.escalateRequest(5L);

        assertEquals("FULFILLED", result.get("status"));
        verifyNoInteractions(donorMatchingService, responseService, eventRepository);
    }

    @Test
    void doesNotRepeatRecentEscalation() {
        BloodRequest request = request(2L, "EMERGENCY", "PENDING");
        when(requestRepository.findById(2L)).thenReturn(java.util.Optional.of(request));
        when(responseRepository.countByBloodRequestIdAndResponse(2L, "ACCEPTED"))
                .thenReturn(0L);
        when(eventRepository
                .existsByRequestIdAndEscalationLevelAndEscalatedAtAfter(
                        eq(2L), eq("EMERGENCY"), any(LocalDateTime.class)))
                .thenReturn(true);

        Map<String, Object> result = service.escalateRequest(2L);

        assertEquals("ALREADY_ESCALATED", result.get("status"));
        verifyNoInteractions(donorMatchingService, responseService);
        verify(eventRepository, never()).save(any());
    }

    @Test
    void recommendsImmediateEscalationForUnresolvedEmergency() {
        BloodRequest request = request(7L, "EMERGENCY", "PENDING");
        request.setCreatedAt(LocalDateTime.now().minusMinutes(5));
        when(requestRepository.findById(7L)).thenReturn(java.util.Optional.of(request));
        when(responseRepository.countByBloodRequestIdAndResponse(7L, "ACCEPTED"))
                .thenReturn(0L);
        when(responseRepository.countByBloodRequestIdAndResponse(7L, "PENDING"))
                .thenReturn(0L);
        when(donorMatchingService.countEligibleAvailableDonors(request))
                .thenReturn(0L);

        var result = service.recommendNextAction(7L);

        assertEquals("ESCALATE_NOW", result.recommendedAction());
        assertEquals(true, result.mandatoryEscalation());
        assertTrue(result.reasons().stream()
                .anyMatch(reason -> reason.contains("remaining")));
    }

    @Test
    void waitsForPendingUrgentResponsesBeforeConfiguredDelay() {
        BloodRequest request = request(8L, "URGENT", "PENDING");
        request.setCreatedAt(LocalDateTime.now().minusMinutes(5));
        when(requestRepository.findById(8L)).thenReturn(java.util.Optional.of(request));
        when(responseRepository.countByBloodRequestIdAndResponse(8L, "ACCEPTED"))
                .thenReturn(0L);
        when(responseRepository.countByBloodRequestIdAndResponse(8L, "PENDING"))
                .thenReturn(2L);
        when(donorMatchingService.countEligibleAvailableDonors(request))
                .thenReturn(1L);

        var result = service.recommendNextAction(8L);

        assertEquals("WAIT_FOR_RESPONSES", result.recommendedAction());
        assertEquals(false, result.mandatoryEscalation());
    }

    @Test
    void fulfilledAndCancelledRecommendationsRequireNoAction() {
        BloodRequest fulfilled = request(9L, "EMERGENCY", "FULFILLED");
        BloodRequest cancelled = request(10L, "EMERGENCY", "CANCELLED");
        when(requestRepository.findById(9L)).thenReturn(java.util.Optional.of(fulfilled));
        when(requestRepository.findById(10L)).thenReturn(java.util.Optional.of(cancelled));
        when(responseRepository.countByBloodRequestIdAndResponse(anyLong(), eq("ACCEPTED")))
                .thenReturn(0L);
        when(responseRepository.countByBloodRequestIdAndResponse(anyLong(), eq("PENDING")))
                .thenReturn(0L);

        assertEquals("NO_ACTION", service.recommendNextAction(9L).recommendedAction());
        assertEquals("NO_ACTION", service.recommendNextAction(10L).recommendedAction());
        verifyNoInteractions(donorMatchingService);
    }

    @Test
    void coordinatorEscalatesEmergencyWithoutEligibleDonors() {
        BloodRequest request = request(11L, "EMERGENCY", "PENDING");
        request.setCreatedAt(LocalDateTime.now().minusMinutes(5));
        when(requestRepository.findById(11L)).thenReturn(java.util.Optional.of(request));
        when(responseRepository.countByBloodRequestIdAndResponse(11L, "ACCEPTED"))
                .thenReturn(0L);
        when(responseRepository.countByBloodRequestIdAndResponse(11L, "PENDING"))
                .thenReturn(0L);
        when(donorMatchingService.countEligibleAvailableDonors(request))
                .thenReturn(0L);
        when(eventRepository.countByRequestId(11L)).thenReturn(0L);
        when(eventRepository.existsByRequestIdAndEscalationLevelAndEscalatedAtAfter(
                eq(11L), eq("EMERGENCY"), any(LocalDateTime.class))).thenReturn(false);

        var result = service.coordinate(11L);

        assertEquals("ALERT_AUTHORIZED_COORDINATOR", result.recommendedAction());
        assertTrue(result.mandatory());
        assertEquals(false, result.mlPredictionsUsed());
        assertTrue(result.missingData().stream()
                .anyMatch(value -> value.contains("ML response prediction")));
    }

    @Test
    void coordinatorStopsOutreachForFulfilledRequest() {
        BloodRequest request = request(12L, "EMERGENCY", "FULFILLED");
        when(requestRepository.findById(12L)).thenReturn(java.util.Optional.of(request));
        when(responseRepository.countByBloodRequestIdAndResponse(12L, "ACCEPTED"))
                .thenReturn(1L);
        when(responseRepository.countByBloodRequestIdAndResponse(12L, "PENDING"))
                .thenReturn(0L);

        var result = service.coordinate(12L);

        assertEquals("STOP_OUTREACH", result.recommendedAction());
        verifyNoInteractions(donorMatchingService);
    }

    @Test
    void coordinatorDoesNotRepeatRecentEscalation() {
        BloodRequest request = request(13L, "EMERGENCY", "PENDING");
        request.setCreatedAt(LocalDateTime.now().minusMinutes(5));
        when(requestRepository.findById(13L)).thenReturn(java.util.Optional.of(request));
        when(responseRepository.countByBloodRequestIdAndResponse(13L, "ACCEPTED"))
                .thenReturn(0L);
        when(responseRepository.countByBloodRequestIdAndResponse(13L, "PENDING"))
                .thenReturn(0L);
        when(donorMatchingService.countEligibleAvailableDonors(request))
                .thenReturn(2L);
        when(eventRepository.countByRequestId(13L)).thenReturn(1L);
        when(eventRepository.existsByRequestIdAndEscalationLevelAndEscalatedAtAfter(
                eq(13L), eq("EMERGENCY"), any(LocalDateTime.class))).thenReturn(true);

        var result = service.coordinate(13L);

        assertEquals("ALERT_AUTHORIZED_COORDINATOR", result.recommendedAction());
        assertTrue(result.reasons().stream()
                .anyMatch(value -> value.contains("cooldown")));
    }

    private BloodRequest request(Long id, String urgency, String status) {
        BloodRequest request = new BloodRequest();
        request.setId(id);
        request.setUrgency(urgency);
        request.setStatus(status);
        request.setUnits(1);
        return request;
    }
}

class EmergencyEscalationSchedulerTest {

    @Test
    void schedulesOnlyUnresolvedUrgentRequests() {
        BloodRequestRepository repository = mock(BloodRequestRepository.class);
        EmergencyEscalationService service = mock(EmergencyEscalationService.class);
        EmergencyEscalationScheduler scheduler =
                new EmergencyEscalationScheduler(repository, service);

        BloodRequest urgent = new BloodRequest();
        urgent.setId(3L);
        urgent.setUrgency("URGENT");
        BloodRequest normal = new BloodRequest();
        normal.setId(4L);
        normal.setUrgency("NORMAL");

        when(repository.findByStatusAndFulfilledAtIsNull("PENDING"))
                .thenReturn(List.of(urgent, normal));

        scheduler.escalateUnresolvedRequests();

        verify(service).escalateRequest(3L);
        verify(service, never()).escalateRequest(4L);
    }
}
