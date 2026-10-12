package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.dto.BloodShortageRisk;
import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.repository.DonorProfileRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class BloodShortageRiskService {

    private static final long RECENT_WINDOW_DAYS = 90;
    private static final String UNKNOWN_LOCATION = "UNKNOWN LOCATION";

    private final BloodRequestRepository bloodRequestRepository;
    private final DonorProfileRepository donorProfileRepository;
    private final DonationEligibilityService eligibilityService;

    public BloodShortageRiskService(
            BloodRequestRepository bloodRequestRepository,
            DonorProfileRepository donorProfileRepository,
            DonationEligibilityService eligibilityService
    ) {
        this.bloodRequestRepository = bloodRequestRepository;
        this.donorProfileRepository = donorProfileRepository;
        this.eligibilityService = eligibilityService;
    }

    public BloodShortageRisk assess() {
        List<BloodRequest> requests = uniqueRequests();
        LocalDateTime recentCutoff = LocalDateTime.now().minusDays(RECENT_WINDOW_DAYS);
        Map<RiskKey, MutableIndicator> indicators = new LinkedHashMap<>();

        for (BloodRequest request : requests) {
            if (!hasText(request.getBloodGroup())) {
                continue;
            }
            RiskKey key = new RiskKey(
                    normalize(request.getBloodGroup()),
                    locationKey(request.getLocation())
            );
            MutableIndicator indicator = indicators.computeIfAbsent(
                    key,
                    ignored -> new MutableIndicator(key.bloodGroup, key.location,
                            !UNKNOWN_LOCATION.equals(key.location))
            );
            indicator.historicalRequests++;
            if (request.getCreatedAt() != null
                    && !request.getCreatedAt().isBefore(recentCutoff)) {
                indicator.recentRequests++;
            }
            if ("PENDING".equalsIgnoreCase(request.getStatus())) {
                indicator.unresolvedRequests++;
            }
        }

        for (MutableIndicator indicator : indicators.values()) {
            indicator.availableEligibleCompatibleDonors =
                    countCompatibleDonors(indicator.bloodGroup, indicator.location);
        }

        List<BloodShortageRisk.RiskIndicator> result = indicators.values()
                .stream()
                .map(this::toResult)
                .sorted(Comparator
                        .comparingInt((BloodShortageRisk.RiskIndicator item) ->
                                riskRank(item.riskLevel()))
                        .reversed()
                        .thenComparing(BloodShortageRisk.RiskIndicator::bloodGroup)
                        .thenComparing(BloodShortageRisk.RiskIndicator::location))
                .toList();

        return new BloodShortageRisk(
                "OBSERVED_RULE_BASED",
                "Observed unresolved demand versus currently available, eligible, compatible donors",
                "High risk means unresolved requests exceed compatible eligible available donors or no such donor is currently known.",
                false,
                result
        );
    }

    private List<BloodRequest> uniqueRequests() {
        Map<Long, BloodRequest> unique = new LinkedHashMap<>();
        for (BloodRequest request : bloodRequestRepository.findAll()) {
            if (request.getId() != null) {
                unique.put(request.getId(), request);
            }
        }
        return unique.values().stream().toList();
    }

    private long countCompatibleDonors(String bloodGroup, String location) {
        return donorProfileRepository.findAll()
                .stream()
                .filter(donor -> donor.isAvailable())
                .filter(donor -> eligibilityService.isEligible(donor))
                .filter(donor -> locationKey(donor.getLocation()).equals(location))
                .filter(donor -> DonorMatchingService.isCompatible(
                        bloodGroup,
                        donor.getBloodGroup()
                ))
                .count();
    }

    private BloodShortageRisk.RiskIndicator toResult(MutableIndicator indicator) {
        List<String> reasons = new ArrayList<>();
        if (indicator.unresolvedRequests > 0) {
            reasons.add(indicator.unresolvedRequests
                    + " unresolved request(s) are currently pending.");
        } else {
            reasons.add("No unresolved pending request is currently recorded.");
        }
        if (indicator.availableEligibleCompatibleDonors == 0) {
            reasons.add("No currently available donor passed eligibility and compatibility checks.");
        } else {
            reasons.add(indicator.availableEligibleCompatibleDonors
                    + " currently available donor(s) passed eligibility and compatibility checks.");
        }
        if (!indicator.locationDataComplete) {
            reasons.add("Location is missing on the request; this is a group-level unknown-location indicator.");
        }
        if (indicator.recentRequests > 0) {
            reasons.add(indicator.recentRequests
                    + " request(s) were created in the recent 90-day window.");
        }

        return new BloodShortageRisk.RiskIndicator(
                indicator.bloodGroup,
                indicator.location,
                riskLevel(indicator),
                indicator.historicalRequests,
                indicator.recentRequests,
                indicator.unresolvedRequests,
                indicator.availableEligibleCompatibleDonors,
                indicator.locationDataComplete,
                reasons
        );
    }

    private String riskLevel(MutableIndicator indicator) {
        if (indicator.unresolvedRequests > 0
                && (indicator.availableEligibleCompatibleDonors == 0
                || indicator.unresolvedRequests > indicator.availableEligibleCompatibleDonors)) {
            return "HIGH";
        }
        if (indicator.recentRequests > indicator.availableEligibleCompatibleDonors
                || (indicator.unresolvedRequests > 0
                && indicator.availableEligibleCompatibleDonors < indicator.unresolvedRequests * 2)) {
            return "MEDIUM";
        }
        return "LOW";
    }

    private int riskRank(String level) {
        return switch (level) {
            case "HIGH" -> 3;
            case "MEDIUM" -> 2;
            default -> 1;
        };
    }

    private String locationKey(String value) {
        return hasText(value) ? normalize(value) : UNKNOWN_LOCATION;
    }

    private String normalize(String value) {
        return value.trim().replaceAll("\\s+", " ").toUpperCase(Locale.ROOT);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private record RiskKey(String bloodGroup, String location) {
    }

    private static final class MutableIndicator {
        private final String bloodGroup;
        private final String location;
        private final boolean locationDataComplete;
        private long historicalRequests;
        private long recentRequests;
        private long unresolvedRequests;
        private long availableEligibleCompatibleDonors;

        private MutableIndicator(
                String bloodGroup,
                String location,
                boolean locationDataComplete
        ) {
            this.bloodGroup = bloodGroup;
            this.location = location;
            this.locationDataComplete = locationDataComplete;
        }
    }
}
