package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.DonorRequestResponse;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.repository.DonorRequestResponseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmergencyEscalationService {

    private final BloodRequestRepository requestRepository;

    private final DonorRequestResponseRepository responseRepository;

    public EmergencyEscalationService(
            BloodRequestRepository requestRepository,
            DonorRequestResponseRepository responseRepository
    ) {
        this.requestRepository = requestRepository;
        this.responseRepository = responseRepository;
    }

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

        if (accepted >= required) {
            return "FULFILLED";
        }

        if ("EMERGENCY".equalsIgnoreCase(
                request.getUrgency()
        )) {

            return "EMERGENCY_ESCALATION";
        }

        if ("URGENT".equalsIgnoreCase(
                request.getUrgency()
        )) {

            return "HIGH_PRIORITY";
        }

        return "NORMAL";
    }

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