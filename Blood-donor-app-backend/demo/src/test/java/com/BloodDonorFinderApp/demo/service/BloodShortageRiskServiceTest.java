package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.repository.DonorProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BloodShortageRiskServiceTest {

    private BloodRequestRepository requestRepository;
    private DonorProfileRepository donorRepository;
    private DonationEligibilityService eligibilityService;
    private BloodShortageRiskService service;

    @BeforeEach
    void setUp() {
        requestRepository = mock(BloodRequestRepository.class);
        donorRepository = mock(DonorProfileRepository.class);
        eligibilityService = mock(DonationEligibilityService.class);
        service = new BloodShortageRiskService(
                requestRepository,
                donorRepository,
                eligibilityService
        );
        when(donorRepository.findAll()).thenReturn(List.of());
    }

    @Test
    void reportsHighRiskWhenPendingDemandHasNoEligibleCompatibleSupply() {
        when(requestRepository.findAll()).thenReturn(List.of(
                request(1L, "A+", "City", "PENDING")
        ));

        var indicator = service.assess().indicators().get(0);

        assertEquals("HIGH", indicator.riskLevel());
        assertEquals(1, indicator.unresolvedRequests());
        assertEquals(0, indicator.availableEligibleCompatibleDonors());
        assertTrue(indicator.reasons().stream()
                .anyMatch(reason -> reason.contains("No currently available")));
    }

    @Test
    void reportsLowRiskWhenEligibleCompatibleSupplyComfortablyExceedsDemand() {
        DonorProfile donor = donor(1L, "O-", "City", true);
        DonorProfile secondDonor = donor(2L, "O-", "City", true);
        when(donorRepository.findAll()).thenReturn(List.of(donor, secondDonor));
        when(eligibilityService.isEligible(donor)).thenReturn(true);
        when(eligibilityService.isEligible(secondDonor)).thenReturn(true);
        when(requestRepository.findAll()).thenReturn(List.of(
                request(1L, "A+", "City", "PENDING")
        ));

        var indicator = service.assess().indicators().get(0);

        assertEquals("LOW", indicator.riskLevel());
        assertEquals(2, indicator.availableEligibleCompatibleDonors());
    }

    @Test
    void reportsMediumRiskWhenRecentDemandExceedsCurrentEligibleSupply() {
        DonorProfile donor = donor(1L, "A+", "City", true);
        when(donorRepository.findAll()).thenReturn(List.of(donor));
        when(eligibilityService.isEligible(donor)).thenReturn(true);
        when(requestRepository.findAll()).thenReturn(List.of(
                request(1L, "A+", "City", "FULFILLED"),
                request(2L, "A+", "City", "FULFILLED"),
                request(3L, "A+", "City", "FULFILLED")
        ));

        var indicator = service.assess().indicators().get(0);

        assertEquals("MEDIUM", indicator.riskLevel());
        assertEquals(0, indicator.unresolvedRequests());
        assertTrue(indicator.recentRequests() >= 1);
    }

    @Test
    void marksMissingRequestLocationAndDoesNotCountKnownLocationDonor() {
        DonorProfile donor = donor(1L, "O-", "City", true);
        when(donorRepository.findAll()).thenReturn(List.of(donor));
        when(eligibilityService.isEligible(donor)).thenReturn(true);
        when(requestRepository.findAll()).thenReturn(List.of(
                request(1L, "A+", null, "PENDING")
        ));

        var indicator = service.assess().indicators().get(0);

        assertFalse(indicator.locationDataComplete());
        assertEquals("UNKNOWN LOCATION", indicator.location());
        assertEquals(0, indicator.availableEligibleCompatibleDonors());
        assertTrue(indicator.reasons().stream()
                .anyMatch(reason -> reason.contains("Location is missing")));
    }

    private BloodRequest request(
            Long id,
            String bloodGroup,
            String location,
            String status
    ) {
        BloodRequest request = new BloodRequest();
        request.setId(id);
        request.setBloodGroup(bloodGroup);
        request.setLocation(location);
        request.setStatus(status);
        request.setCreatedAt(LocalDateTime.now().minusDays(10));
        return request;
    }

    private DonorProfile donor(
            Long id,
            String bloodGroup,
            String location,
            boolean available
    ) {
        DonorProfile donor = new DonorProfile();
        donor.setId(id);
        donor.setBloodGroup(bloodGroup);
        donor.setLocation(location);
        donor.setAvailable(available);
        return donor;
    }
}
