package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.DonorRequestResponse;
import com.BloodDonorFinderApp.demo.entity.EmergencyEscalationEvent;
import com.BloodDonorFinderApp.demo.dto.EmergencyEscalationRecommendation;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.repository.DonorRequestResponseRepository;
import com.BloodDonorFinderApp.demo.repository.EmergencyEscalationEventRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@Service
public class EmergencyEscalationService {

    private final BloodRequestRepository requestRepository;
    private final DonorRequestResponseRepository responseRepository;
    private final DonorMatchingService donorMatchingService;
    private final DonorRequestResponseService responseService;
    private final EmergencyEscalationEventRepository eventRepository;
    private final long escalationCooldownMinutes;
    private final long urgentRecommendationDelayMinutes;

    @Autowired
    public EmergencyEscalationService(
            BloodRequestRepository requestRepository,
            DonorRequestResponseRepository responseRepository,
            DonorMatchingService donorMatchingService,
            DonorRequestResponseService responseService,
            EmergencyEscalationEventRepository eventRepository,
            @org.springframework.beans.factory.annotation.Value(
                    "${app.emergency.escalation-cooldown-minutes:30}"
            ) long escalationCooldownMinutes,
            @org.springframework.beans.factory.annotation.Value(
                    "${app.emergency.urgent-recommendation-delay-minutes:30}"
            ) long urgentRecommendationDelayMinutes
    ) {
        this.requestRepository = requestRepository;
        this.responseRepository = responseRepository;
        this.donorMatchingService = donorMatchingService;
        this.responseService = responseService;
        this.eventRepository = eventRepository;
        this.escalationCooldownMinutes = escalationCooldownMinutes;
        this.urgentRecommendationDelayMinutes =
                urgentRecommendationDelayMinutes;
    }

    public EmergencyEscalationService(
            BloodRequestRepository requestRepository,
            DonorRequestResponseRepository responseRepository,
            DonorMatchingService donorMatchingService,
            DonorRequestResponseService responseService,
            EmergencyEscalationEventRepository eventRepository,
            long escalationCooldownMinutes
    ) {
        this(
                requestRepository,
                responseRepository,
                donorMatchingService,
                responseService,
                eventRepository,
                escalationCooldownMinutes,
                30
        );
    }

    public EmergencyEscalationRecommendation recommendNextAction(
            Long requestId
    ) {
        BloodRequest request =
                requestRepository.findById(requestId)
                        .orElseThrow(() ->
                                new RuntimeException("Blood request not found"));

        long accepted = responseRepository
                .countByBloodRequestIdAndResponse(requestId, "ACCEPTED");
        long pending = responseRepository
                .countByBloodRequestIdAndResponse(requestId, "PENDING");
        long required = request.getUnits() == null ? 1 : request.getUnits();

        if ("FULFILLED".equalsIgnoreCase(request.getStatus())
                || "CANCELLED".equalsIgnoreCase(request.getStatus())) {
            return recommendation(
                    request, "NO_ACTION", false, accepted, pending, 0,
                    List.of("Request is already "
                            + request.getStatus().toLowerCase()
                            + "; no further outreach is appropriate.")
            );
        }

        if (!"URGENT".equalsIgnoreCase(request.getUrgency())
                && !"EMERGENCY".equalsIgnoreCase(request.getUrgency())) {
            return recommendation(
                    request, "MONITOR", false, accepted, pending, 0,
                    List.of("Request urgency does not require emergency escalation.")
            );
        }

        if (accepted >= required) {
            return recommendation(
                    request, "NO_ACTION", false, accepted, pending, 0,
                    List.of("Accepted responses meet the requested unit count.")
            );
        }

        long elapsedMinutes = elapsedMinutes(request);
        boolean emergency = "EMERGENCY".equalsIgnoreCase(request.getUrgency());
        boolean mandatory = emergency
                || elapsedMinutes >= urgentRecommendationDelayMinutes;

        long eligibleMatches =
                donorMatchingService.countEligibleAvailableDonors(request);
        List<String> reasons = new java.util.ArrayList<>();
        reasons.add("Request has " + (required - accepted)
                + " unit(s) remaining after accepted responses.");
        reasons.add(elapsedMinutes + " minute(s) have elapsed since request creation.");
        reasons.add(eligibleMatches
                + " currently available donor match(es) passed matching filters.");

        if (mandatory && pending == 0 && eligibleMatches == 0) {
            reasons.add("No pending invitations or eligible matches remain.");
            return recommendation(
                    request, "ESCALATE_NOW", true, accepted, pending,
                    eligibleMatches, reasons
            );
        }
        if (mandatory) {
            reasons.add("Urgency and elapsed-time rules require another outreach action.");
            return recommendation(
                    request, "ESCALATE_NOW", true, accepted, pending,
                    eligibleMatches, reasons
            );
        }
        reasons.add("The configured urgent delay has not elapsed; continue monitoring current invitations.");
        return recommendation(
                request, "WAIT_FOR_RESPONSES", false, accepted, pending,
                eligibleMatches, reasons
        );
    }

    public com.BloodDonorFinderApp.demo.dto.EmergencyCoordinatorRecommendation
            coordinate(Long requestId) {
        BloodRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Blood request not found"));
        long accepted = responseRepository.countByBloodRequestIdAndResponse(requestId, "ACCEPTED");
        long outstanding = responseRepository.countByBloodRequestIdAndResponse(requestId, "PENDING");
        long required = request.getUnits() == null ? 1 : request.getUnits();
        long eligible = 0;
        List<String> reasons = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        Map<String, Object> evidence = new HashMap<>();
        evidence.put("requiredUnits", required);
        evidence.put("remainingUnits", Math.max(0, required - accepted));
        evidence.put("elapsedMinutes", elapsedMinutes(request));
        evidence.put("outstandingResponses", outstanding);

        if ("FULFILLED".equalsIgnoreCase(request.getStatus())
                || "CANCELLED".equalsIgnoreCase(request.getStatus())) {
            reasons.add("The request is closed; no further donor outreach is appropriate.");
            return coordinatorRecommendation(request, "STOP_OUTREACH", false, accepted,
                    outstanding, eligible, reasons, missing, evidence);
        }
        if (accepted >= required) {
            reasons.add("Accepted responses meet the requested unit count; this is not proof of donation.");
            return coordinatorRecommendation(request, "STOP_OUTREACH", false, accepted,
                    outstanding, eligible, reasons, missing, evidence);
        }

        eligible = donorMatchingService.countEligibleAvailableDonors(request);
        evidence.put("eligibleAvailableDonors", eligible);
        evidence.put("acceptedResponses", accepted);
        evidence.put("requestStatus", request.getStatus());
        missing.add("No production ML response prediction is available for this coordination decision.");

        boolean emergency = "EMERGENCY".equalsIgnoreCase(request.getUrgency());
        boolean urgent = "URGENT".equalsIgnoreCase(request.getUrgency());
        long escalationCount = eventRepository.countByRequestId(requestId);
        evidence.put("recentEscalationEvents", escalationCount);
        boolean recentEscalation = eventRepository
                .existsByRequestIdAndEscalationLevelAndEscalatedAtAfter(
                        requestId, emergency ? "EMERGENCY" : "URGENT",
                        LocalDateTime.now().minusMinutes(escalationCooldownMinutes));

        if (!emergency && !urgent) {
            reasons.add("Request urgency supports monitoring rather than emergency escalation.");
            return coordinatorRecommendation(request, "CONTINUE_MONITORING", false, accepted,
                    outstanding, eligible, reasons, missing, evidence);
        }
        if (!emergency && elapsedMinutes(request) < urgentRecommendationDelayMinutes) {
            reasons.add("The configured urgent response window has not elapsed.");
            reasons.add(outstanding + " outstanding donor response(s) remain.");
            return coordinatorRecommendation(request, "CONTINUE_MONITORING", false, accepted,
                    outstanding, eligible, reasons, missing, evidence);
        }
        reasons.add(emergency
                ? "Emergency urgency requires escalation independent of uncertain predictions."
                : "Urgency and elapsed-time rules require additional outreach.");
        if (recentEscalation) {
            reasons.add("A recent escalation already exists within the configured cooldown.");
            return coordinatorRecommendation(request, "ALERT_AUTHORIZED_COORDINATOR", true,
                    accepted, outstanding, eligible, reasons, missing, evidence);
        }
        if (eligible == 0) {
            reasons.add("No currently available, eligible, compatible donor match was found.");
            return coordinatorRecommendation(request, "ALERT_AUTHORIZED_COORDINATOR", true,
                    accepted, outstanding, eligible, reasons, missing, evidence);
        }
        reasons.add(eligible + " currently available donor match(es) passed compatibility and eligibility filters.");
        return coordinatorRecommendation(request,
                emergency ? "ESCALATE_REQUEST" : "CONTACT_ADDITIONAL_DONORS",
                true, accepted, outstanding, eligible, reasons, missing, evidence);
    }

    private com.BloodDonorFinderApp.demo.dto.EmergencyCoordinatorRecommendation
            coordinatorRecommendation(BloodRequest request, String action, boolean mandatory,
                    long accepted, long outstanding, long eligible, List<String> reasons,
                    List<String> missing, Map<String, Object> evidence) {
        return new com.BloodDonorFinderApp.demo.dto.EmergencyCoordinatorRecommendation(
                request.getId(), request.getStatus(), request.getUrgency(), action, mandatory,
                elapsedMinutes(request), request.getUnits() == null ? 1 : request.getUnits(),
                accepted, outstanding, eligible, eventRepository.countByRequestId(request.getId()),
                false, reasons, missing, evidence);
    }

    private EmergencyEscalationRecommendation recommendation(
            BloodRequest request,
            String action,
            boolean mandatory,
            long accepted,
            long pending,
            long eligibleMatches,
            List<String> reasons
    ) {
        return new EmergencyEscalationRecommendation(
                request.getId(),
                request.getStatus(),
                action,
                request.getUrgency(),
                elapsedMinutes(request),
                request.getUnits() == null ? 1 : request.getUnits(),
                accepted,
                pending,
                eligibleMatches,
                mandatory,
                reasons
        );
    }

    private long elapsedMinutes(BloodRequest request) {
        if (request.getCreatedAt() == null) {
            return 0;
        }
        return Math.max(0,
                java.time.Duration.between(
                        request.getCreatedAt(), LocalDateTime.now()
                ).toMinutes());
    }

    // =========================================================
    // GET ESCALATION STATUS
    // =========================================================

    public String getEscalationStatus(Long requestId) {

        BloodRequest request =
                requestRepository.findById(requestId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Blood request not found"
                                )
                        );

        long accepted =
                responseRepository
                        .countByBloodRequestIdAndResponse(
                                requestId,
                                "ACCEPTED"
                        );

        int required =
                request.getUnits() == null
                        ? 1
                        : request.getUnits();

        // Already fulfilled
        if (accepted >= required ||
                "FULFILLED".equalsIgnoreCase(request.getStatus())) {

            return "FULFILLED";
        }

        if ("CANCELLED".equalsIgnoreCase(request.getStatus())) {
            return "CANCELLED";
        }

        // Emergency request
        if ("EMERGENCY".equalsIgnoreCase(
                request.getUrgency()
        )) {

            return "EMERGENCY_ESCALATION";
        }

        // Urgent request
        if ("URGENT".equalsIgnoreCase(
                request.getUrgency()
        )) {

            return "HIGH_PRIORITY";
        }

        return "NORMAL";
    }


    // =========================================================
    // AUTOMATIC DONOR ESCALATION
    // =========================================================

    @Transactional
    public Map<String, Object> escalateRequest(
            Long requestId
    ) {

        BloodRequest request =
                requestRepository.findById(requestId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Blood request not found"
                                )
                        );

        long accepted =
                responseRepository
                        .countByBloodRequestIdAndResponse(
                                requestId,
                                "ACCEPTED"
                        );

        int required =
                request.getUnits() == null
                        ? 1
                        : request.getUnits();

        long remaining =
                Math.max(
                        0,
                        required - accepted
                );

        Map<String, Object> result =
                new HashMap<>();

        result.put(
                "requestId",
                requestId
        );

        result.put(
                "requiredUnits",
                required
        );

        result.put(
                "acceptedDonors",
                accepted
        );

        result.put(
                "remainingUnits",
                remaining
        );


        // =====================================================
        // ALREADY FULFILLED
        // =====================================================

        if (remaining <= 0 ||
                "FULFILLED".equalsIgnoreCase(request.getStatus()) ||
                "CANCELLED".equalsIgnoreCase(request.getStatus())) {

            result.put("status", request.getStatus());

            result.put(
                    "message",
                    "Request is already closed or fulfilled."
            );

            result.put(
                    "newRecommendations",
                    0
            );

            return result;
        }


        // =====================================================
        // CHECK URGENCY
        // =====================================================

        boolean emergency =
                "EMERGENCY".equalsIgnoreCase(
                        request.getUrgency()
                );

        boolean urgent =
                "URGENT".equalsIgnoreCase(
                        request.getUrgency()
                );


        if (!emergency && !urgent) {

            result.put(
                    "status",
                    "NOT_ESCALATED"
            );

            result.put(
                    "message",
                    "Request does not require emergency escalation."
            );

            result.put(
                    "newRecommendations",
                    0
            );

            return result;
        }

        String escalationLevel = emergency ? "EMERGENCY" : "URGENT";
        boolean recentlyEscalated =
                eventRepository
                        .existsByRequestIdAndEscalationLevelAndEscalatedAtAfter(
                                requestId,
                                escalationLevel,
                                LocalDateTime.now().minusMinutes(
                                        escalationCooldownMinutes
                                )
                        );

        if (recentlyEscalated) {
            result.put("status", "ALREADY_ESCALATED");
            result.put(
                    "message",
                    "This request was escalated recently."
            );
            result.put("newRecommendations", 0);
            return result;
        }


        // =====================================================
        // RUN SMARTBLOOD MATCHING
        // =====================================================

        List<DonorMatchingService.DonorMatchResult> matches =
                donorMatchingService.findBestDonors(
                        request
                );


        // =====================================================
        // SAVE ONLY NEW RECOMMENDATIONS
        // =====================================================

        List<DonorRequestResponse> recommendations =
                responseService.saveRecommendedDonors(
                        request,
                        matches
                );


        // =====================================================
        // LIMIT RESULTS FOR ESCALATION
        // =====================================================

        int maximumRecommendations;

        if (emergency) {

            maximumRecommendations = 10;

        } else {

            maximumRecommendations = 5;
        }


        int recommendationCount =
                Math.min(
                        recommendations.size(),
                        maximumRecommendations
                );

        eventRepository.save(
                new EmergencyEscalationEvent(
                        requestId,
                        escalationLevel,
                        recommendationCount
                )
        );


        // =====================================================
        // RESPONSE
        // =====================================================

        result.put(
                "status",
                emergency
                        ? "EMERGENCY_ESCALATION"
                        : "HIGH_PRIORITY"
        );

        result.put(
                "message",
                emergency
                        ? "Emergency donor escalation activated."
                        : "High-priority donor escalation activated."
        );

        result.put(
                "totalMatchedDonors",
                matches.size()
        );

        result.put(
                "newRecommendations",
                recommendationCount
        );

        result.put(
                "recommendations",
                recommendations
        );

        return result;
    }


    // =========================================================
    // GET ACCEPTED DONORS
    // =========================================================

    public List<DonorRequestResponse> getAcceptedDonors(
            Long requestId
    ) {

        return responseRepository
                .findByBloodRequestIdAndResponseOrderByMatchScoreDesc(
                        requestId,
                        "ACCEPTED"
                );
    }
}