package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.DonorRequestResponse;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.repository.DonorRequestResponseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.*;

class FulfilledRequestCleanupServiceTest {

    private BloodRequestRepository requestRepository;
    private DonorRequestResponseRepository responseRepository;
    private FulfilledRequestCleanupService service;

    @BeforeEach
    void setUp() {
        requestRepository = mock(BloodRequestRepository.class);
        responseRepository = mock(DonorRequestResponseRepository.class);
        service = new FulfilledRequestCleanupService(
                requestRepository,
                responseRepository,
                10
        );
    }

    @Test
    void deletesOnlyExpiredFulfilledRequestsAndTheirResponses() {
        BloodRequest expired = request(1L, "FULFILLED",
                LocalDateTime.now().minusDays(11));
        DonorRequestResponse response = new DonorRequestResponse();

        when(requestRepository.findByStatusAndFulfilledAtBefore(
                eq("FULFILLED"),
                any(LocalDateTime.class)
        )).thenReturn(List.of(expired));
        when(responseRepository.findByBloodRequestId(1L))
                .thenReturn(List.of(response));

        service.deleteExpiredFulfilledRequests();

        verify(responseRepository).deleteAll(List.of(response));
        verify(requestRepository).delete(expired);
    }

    @Test
    void skipsARequestThatIsNoLongerEligibleBeforeDeletingChildren() {
        BloodRequest pending = request(2L, "PENDING",
                LocalDateTime.now().minusDays(11));
        BloodRequest missingTimestamp = request(3L, "FULFILLED", null);

        when(requestRepository.findByStatusAndFulfilledAtBefore(
                eq("FULFILLED"),
                any(LocalDateTime.class)
        )).thenReturn(List.of(pending, missingTimestamp));

        service.deleteExpiredFulfilledRequests();

        verify(responseRepository, never()).findByBloodRequestId(anyLong());
        verify(responseRepository, never()).deleteAll(any());
        verify(requestRepository, never()).delete(any());
    }

    private BloodRequest request(
            Long id,
            String status,
            LocalDateTime fulfilledAt
    ) {
        BloodRequest request = new BloodRequest();
        request.setId(id);
        request.setStatus(status);
        request.setFulfilledAt(fulfilledAt);
        return request;
    }
}
