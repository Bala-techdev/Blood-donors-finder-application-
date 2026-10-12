package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.dto.OutreachOptimization;
import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.DonorRequestResponse;
import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.repository.DonorRequestResponseRepository;
import com.BloodDonorFinderApp.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class OutreachOptimizationService {

    private final BloodRequestRepository requestRepository;
    private final DonorRequestResponseRepository responseRepository;
    private final DonorMatchingService matchingService;
    private final UserRepository userRepository;
    private final int candidateMultiplier;

    public OutreachOptimizationService(
            BloodRequestRepository requestRepository,
            DonorRequestResponseRepository responseRepository,
            DonorMatchingService matchingService,
            UserRepository userRepository,
            @Value("${app.matching.outreach-candidate-multiplier:3}")
            int candidateMultiplier) {
        this.requestRepository = requestRepository;
        this.responseRepository = responseRepository;
        this.matchingService = matchingService;
        this.userRepository = userRepository;
        this.candidateMultiplier = Math.max(1, candidateMultiplier);
    }

    public OutreachOptimization optimize(Long requestId, String email) {
        BloodRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Blood request not found"));
        User requester = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (request.getRequester() == null
                || !request.getRequester().getId().equals(requester.getId())) {
            throw new RuntimeException("Only the request owner can view outreach recommendations");
        }

        long required = request.getUnits() == null ? 1 : request.getUnits();
        long accepted = responseRepository
                .countByBloodRequestIdAndResponse(requestId, "ACCEPTED");
        long remaining = Math.max(0, required - accepted);
        List<String> warnings = new ArrayList<>();
        warnings.add("Recommendations are not confirmed responses and do not guarantee blood availability.");
        warnings.add("Donor contact preferences and contact limits are not stored by the current schema.");

        if ("FULFILLED".equalsIgnoreCase(request.getStatus())
                || "CANCELLED".equalsIgnoreCase(request.getStatus())
                || remaining == 0) {
            warnings.add("The request is closed or already has enough accepted responses; no outreach is recommended.");
            return new OutreachOptimization(requestId, request.getStatus(), remaining, 0,
                    null, false, warnings, List.of());
        }

        Set<Long> existingDonors = new HashSet<>();
        for (DonorRequestResponse response : responseRepository.findByBloodRequestId(requestId)) {
            if (response.getDonor() != null && response.getDonor().getId() != null) {
                existingDonors.add(response.getDonor().getId());
            }
        }

        List<DonorMatchingService.DonorMatchResult> candidates = matchingService
                .findBestDonors(request).stream()
                .filter(match -> match.getDonor() != null
                        && match.getDonor().getId() != null
                        && !existingDonors.contains(match.getDonor().getId()))
                .distinct()
                .limit(remaining * candidateMultiplier)
                .toList();

        if (candidates.isEmpty()) {
            warnings.add("No new donor passed compatibility, availability, and eligibility filters.");
        }

        List<OutreachOptimization.RecommendedDonor> donors = new ArrayList<>();
        boolean allPredictionsAvailable = !candidates.isEmpty();
        double probabilityProduct = 1.0;
        for (DonorMatchingService.DonorMatchResult candidate : candidates) {
            allPredictionsAvailable &= candidate.isResponsePredictionAvailable();
            probabilityProduct *= 1.0 - (candidate.getResponseProbability() / 100.0);
            List<String> reasons = new ArrayList<>(candidate.getFactualReasons());
            if (candidate.isResponsePredictionAvailable()) {
                reasons.add("Model-estimated response probability: "
                        + String.format(java.util.Locale.ROOT, "%.1f%%",
                        candidate.getResponseProbability()));
            } else {
                reasons.add("ML response prediction unavailable; selection uses rule-based evidence.");
            }
            donors.add(new OutreachOptimization.RecommendedDonor(
                    candidate.getDonor().getId(),
                    candidate.getDonor().getUser() == null
                            ? "Donor" : candidate.getDonor().getUser().getName(),
                    candidate.getDonor().getBloodGroup(),
                    candidate.getDonor().getLocation(),
                    candidate.getDistance(),
                    candidate.getScore(),
                    candidate.getResponseProbability(),
                    candidate.isResponsePredictionAvailable(),
                    reasons));
        }
        Double aggregate = allPredictionsAvailable
                ? (1.0 - probabilityProduct) * 100.0 : null;
        if (aggregate == null) {
            warnings.add("Aggregate response likelihood is unavailable because one or more model predictions are unavailable.");
        } else {
            warnings.add("Aggregate likelihood assumes independent donor responses; it is not a probability of completed donation.");
        }
        return new OutreachOptimization(requestId, request.getStatus(), remaining, donors.size(),
                aggregate, aggregate != null, warnings, donors);
    }
}
