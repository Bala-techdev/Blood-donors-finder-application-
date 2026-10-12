package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import com.BloodDonorFinderApp.demo.entity.DonorRequestResponse;
import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.repository.DonorRequestResponseRepository;
import com.BloodDonorFinderApp.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OutreachOptimizationServiceTest {
    private BloodRequestRepository requests;
    private DonorRequestResponseRepository responses;
    private DonorMatchingService matching;
    private UserRepository users;
    private OutreachOptimizationService service;
    private User requester;
    private BloodRequest request;

    @BeforeEach
    void setUp() {
        requests = mock(BloodRequestRepository.class);
        responses = mock(DonorRequestResponseRepository.class);
        matching = mock(DonorMatchingService.class);
        users = mock(UserRepository.class);
        service = new OutreachOptimizationService(requests, responses, matching, users, 3);
        requester = new User();
        requester.setId(1L);
        requester.setEmail("owner@example.com");
        request = new BloodRequest();
        request.setId(20L);
        request.setRequester(requester);
        request.setBloodGroup("A+");
        request.setUnits(2);
        request.setStatus("PENDING");
        when(requests.findById(20L)).thenReturn(Optional.of(request));
        when(users.findByEmail("owner@example.com")).thenReturn(Optional.of(requester));
        when(responses.findByBloodRequestId(20L)).thenReturn(List.of());
        when(responses.countByBloodRequestIdAndResponse(20L, "ACCEPTED")).thenReturn(0L);
    }

    @Test
    void excludesExistingResponsesAndKeepsOnlyEligibleMatchingCandidates() {
        DonorProfile alreadyContacted = donor(2L, "Existing");
        DonorProfile candidate = donor(3L, "Candidate");
        DonorRequestResponse existing = new DonorRequestResponse();
        existing.setDonor(alreadyContacted);
        when(responses.findByBloodRequestId(20L)).thenReturn(List.of(existing));
        when(matching.findBestDonors(request)).thenReturn(List.of(
                result(alreadyContacted, 90, true),
                result(candidate, 80, true)));

        var result = service.optimize(20L, "owner@example.com");

        assertEquals(1, result.recommendedDonorCount());
        assertEquals(3L, result.donors().get(0).donorId());
        assertTrue(result.warnings().stream()
                .anyMatch(warning -> warning.contains("contact preferences")));
    }

    @Test
    void fulfilledRequestStopsOutreach() {
        request.setStatus("FULFILLED");
        var result = service.optimize(20L, "owner@example.com");
        assertEquals(0, result.recommendedDonorCount());
        assertTrue(result.donors().isEmpty());
        verifyNoInteractions(matching);
    }

    @Test
    void missingModelPredictionsDoNotProduceAggregateProbability() {
        DonorProfile candidate = donor(4L, "Candidate");
        when(matching.findBestDonors(request)).thenReturn(List.of(
                result(candidate, 70, false)));

        var result = service.optimize(20L, "owner@example.com");

        assertNull(result.aggregateResponseLikelihood());
        assertFalse(result.aggregateUsesIndependenceAssumption());
        assertTrue(result.warnings().stream()
                .anyMatch(warning -> warning.contains("unavailable")));
    }

    @Test
    void rejectsNonOwner() {
        User other = new User();
        other.setId(9L);
        when(users.findByEmail("other@example.com")).thenReturn(Optional.of(other));
        assertThrows(RuntimeException.class,
                () -> service.optimize(20L, "other@example.com"));
    }

    private DonorProfile donor(long id, String name) {
        DonorProfile donor = new DonorProfile();
        donor.setId(id);
        donor.setBloodGroup("O-");
        donor.setAvailable(true);
        User user = new User();
        user.setName(name);
        donor.setUser(user);
        return donor;
    }

    private DonorMatchingService.DonorMatchResult result(
            DonorProfile donor, double score, boolean predictionAvailable) {
        return new DonorMatchingService.DonorMatchResult(
                donor,
                score,
                4.0,
                true,
                -1L,
                new DonorMatchingService.MatchScoreBreakdown(),
                predictionAvailable ? 60.0 : 50.0,
                "Compatible",
                score,
                0,
                predictionAvailable,
                predictionAvailable ? "test-model" : "unavailable",
                predictionAvailable ? "MODEL_PREDICTED" : "FALLBACK",
                List.of("Compatible blood group"),
                List.of());
    }
}
