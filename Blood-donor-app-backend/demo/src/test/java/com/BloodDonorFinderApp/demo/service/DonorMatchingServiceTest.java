package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.dto.DonorReliabilityResult;
import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import com.BloodDonorFinderApp.demo.repository.DonorProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DonorMatchingServiceTest {

    private DonorProfileRepository donorProfileRepository;
    private DonationEligibilityService eligibilityService;
    private DonorReliabilityService reliabilityService;
    private MlPredictionService mlPredictionService;
    private DonorMatchingService service;
    private long nextDonorId;

    @BeforeEach
    void setUp() {
        donorProfileRepository = mock(DonorProfileRepository.class);
        eligibilityService = mock(DonationEligibilityService.class);
        reliabilityService = mock(DonorReliabilityService.class);
        mlPredictionService = mock(MlPredictionService.class);
        service = new DonorMatchingService(
                donorProfileRepository,
                eligibilityService,
                reliabilityService,
                mlPredictionService
        );
        nextDonorId = 1L;

        when(mlPredictionService.predictResponse(
                anyInt(), anyDouble(), anyInt(), anyInt(), anyInt(),
                anyInt(), anyInt(), anyInt(), anyInt(), anyDouble(),
                anyDouble(), anyDouble()
        )).thenReturn(new MlPredictionService.PredictionResult(
                50.0, true, "test-model", "MODEL_PREDICTED"
        ));
    }

    @Test
    void isCompatible_usesRedCellCompatibilityRules() {
        assertTrue(DonorMatchingService.isCompatible("A+", "O-"));
        assertTrue(DonorMatchingService.isCompatible("AB+", "B-"));
        assertTrue(DonorMatchingService.isCompatible("O-", "O-"));
        assertFalse(DonorMatchingService.isCompatible("O-", "O+"));
        assertFalse(DonorMatchingService.isCompatible("A-", "B-"));
    }

    @Test
    void findBestDonors_excludesUnavailableAndIneligibleDonors() {
        BloodRequest request = request("A+", "NORMAL");
        DonorProfile unavailable = donor("O-", false, 1.0, 36.0);
        DonorProfile eligible = donor("O-", true, 1.1, 36.1);

        when(donorProfileRepository.findAll())
                .thenReturn(List.of(unavailable, eligible));
        when(eligibilityService.isEligible(unavailable)).thenReturn(false);
        when(eligibilityService.isEligible(eligible)).thenReturn(true);
        when(eligibilityService.getDaysSinceLastDonation(eligible)).thenReturn(-1L);
        when(reliabilityService.calculateReliability(eligible.getId()))
                .thenReturn(reliability(eligible.getId(), 0, 0));

        List<DonorMatchingService.DonorMatchResult> matches =
                service.findBestDonors(request);

        assertEquals(1, matches.size());
        assertSame(eligible, matches.get(0).getDonor());
        assertTrue(matches.get(0).getExplanation().contains("Compatible blood group"));
        assertEquals(50.0, matches.get(0).getResponseProbability());
        assertTrue(matches.get(0).isResponsePredictionAvailable());
        assertEquals("test-model", matches.get(0).getResponseModelVersion());
        assertFalse(matches.get(0).getFactualReasons().isEmpty());
    }

    @Test
    void findBestDonors_handlesMissingCoordinatesWithoutFakeDistanceScore() {
        BloodRequest request = request("A+", "NORMAL");
        request.setLatitude(null);
        request.setLongitude(null);
        DonorProfile donor = donor("A+", true, null, null);

        when(donorProfileRepository.findAll()).thenReturn(List.of(donor));
        when(eligibilityService.isEligible(donor)).thenReturn(true);
        when(eligibilityService.getDaysSinceLastDonation(donor)).thenReturn(-1L);
        when(reliabilityService.calculateReliability(donor.getId()))
                .thenReturn(reliability(donor.getId(), 1, 1));

        DonorMatchingService.DonorMatchResult result =
                service.findBestDonors(request).get(0);

        assertEquals(999.0, result.getDistance());
        assertEquals(0.0, result.getScoreBreakdown().getDistanceScore());
        assertTrue(result.getExplanation().contains("coordinates are missing"));
        assertTrue(result.getFactualReasons().stream()
                .anyMatch(reason -> reason.contains("not measured")));
    }

    @Test
    void findBestDonors_prioritizesEmergencyRequests() {
        BloodRequest normal = request("A+", "NORMAL");
        BloodRequest emergency = request("A+", "EMERGENCY");
        DonorProfile donor = donor("A+", true, 1.0, 36.0);

        when(donorProfileRepository.findAll()).thenReturn(List.of(donor));
        when(eligibilityService.isEligible(donor)).thenReturn(true);
        when(eligibilityService.getDaysSinceLastDonation(donor)).thenReturn(-1L);
        when(reliabilityService.calculateReliability(donor.getId()))
                .thenReturn(reliability(donor.getId(), 0, 0));

        double normalScore = service.findBestDonors(normal).get(0).getScore();
        double emergencyScore = service.findBestDonors(emergency).get(0).getScore();

        assertEquals(5.0, emergencyScore - normalScore, 0.01);
    }

    @Test
    void rankingFormulaKeepsRuleScoreAndPredictionContributionVisible() {
        BloodRequest request = request("A+", "NORMAL");
        DonorProfile donor = donor("A+", true, 1.0, 36.0);
        when(donorProfileRepository.findAll()).thenReturn(List.of(donor));
        when(eligibilityService.isEligible(donor)).thenReturn(true);
        when(eligibilityService.getDaysSinceLastDonation(donor)).thenReturn(-1L);
        when(reliabilityService.calculateReliability(donor.getId()))
                .thenReturn(reliability(donor.getId(), 0, 0));
        when(mlPredictionService.predictResponse(
                anyInt(), anyDouble(), anyInt(), anyInt(), anyInt(),
                anyInt(), anyInt(), anyInt(), anyInt(), anyDouble(),
                anyDouble(), anyDouble()
        )).thenReturn(new MlPredictionService.PredictionResult(
                80.0, true, "test-model", "MODEL_PREDICTED"
        ));

        DonorMatchingService.DonorMatchResult result =
                service.findBestDonors(request).get(0);

        assertEquals(80.0, result.getResponseProbability());
        assertTrue(result.getExplanation().contains("Rule-based score"));
        assertTrue(result.getPredictionReasons().get(0).contains("80.0%"));
    }

    @Test
    void fallbackPredictionIsClearlyDistinguished() {
        BloodRequest request = request("A+", "NORMAL");
        DonorProfile donor = donor("A+", true, 1.0, 36.0);
        when(donorProfileRepository.findAll()).thenReturn(List.of(donor));
        when(eligibilityService.isEligible(donor)).thenReturn(true);
        when(eligibilityService.getDaysSinceLastDonation(donor)).thenReturn(-1L);
        when(reliabilityService.calculateReliability(donor.getId()))
                .thenReturn(reliability(donor.getId(), 0, 0));
        when(mlPredictionService.predictResponse(
                anyInt(), anyDouble(), anyInt(), anyInt(), anyInt(),
                anyInt(), anyInt(), anyInt(), anyInt(), anyDouble(),
                anyDouble(), anyDouble()
        )).thenReturn(new MlPredictionService.PredictionResult(
                50.0, false, "unavailable", "FALLBACK"
        ));

        DonorMatchingService.DonorMatchResult result =
                service.findBestDonors(request).get(0);

        assertFalse(result.isResponsePredictionAvailable());
        assertEquals("FALLBACK", result.getResponsePredictionStatus());
        assertTrue(result.getPredictionReasons().get(0).contains("neutral fallback"));
    }

    private BloodRequest request(String bloodGroup, String urgency) {
        BloodRequest request = new BloodRequest();
        request.setBloodGroup(bloodGroup);
        request.setUrgency(urgency);
        request.setLatitude(1.0);
        request.setLongitude(36.0);
        request.setRequiredDate(LocalDate.now());
        return request;
    }

    private DonorProfile donor(
            String bloodGroup,
            boolean available,
            Double latitude,
            Double longitude
    ) {
        DonorProfile donor = new DonorProfile();
        donor.setId(nextDonorId++);
        donor.setBloodGroup(bloodGroup);
        donor.setAvailable(available);
        donor.setLatitude(latitude);
        donor.setLongitude(longitude);
        donor.setTotalDonations(0);
        return donor;
    }

    private DonorReliabilityResult reliability(
            Long donorId,
            int totalRecommendations,
            int acceptedCount
    ) {
        return new DonorReliabilityResult(
                donorId,
                50.0,
                "NEW",
                totalRecommendations,
                acceptedCount,
                acceptedCount,
                0,
                0,
                totalRecommendations == 0 ? 0.0 : 100.0,
                totalRecommendations == 0 ? 0.0 : 100.0,
                "test"
        );
    }
}
