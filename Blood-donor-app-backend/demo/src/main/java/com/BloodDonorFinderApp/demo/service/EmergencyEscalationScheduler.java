package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmergencyEscalationScheduler {

    private static final Logger logger =
            LoggerFactory.getLogger(EmergencyEscalationScheduler.class);

    private final BloodRequestRepository requestRepository;
    private final EmergencyEscalationService escalationService;

    public EmergencyEscalationScheduler(
            BloodRequestRepository requestRepository,
            EmergencyEscalationService escalationService
    ) {
        this.requestRepository = requestRepository;
        this.escalationService = escalationService;
    }

    @Scheduled(
            fixedDelayString =
                    "${app.emergency.escalation-delay-ms:300000}"
    )
    public void escalateUnresolvedRequests() {
        List<BloodRequest> requests =
                requestRepository.findByStatusAndFulfilledAtIsNull("PENDING");

        for (BloodRequest request : requests) {
            if (!isEscalatable(request)) {
                continue;
            }

            try {
                escalationService.escalateRequest(request.getId());
            } catch (RuntimeException exception) {
                logger.warn(
                        "Emergency escalation failed for request {}: {}",
                        request.getId(),
                        exception.getMessage()
                );
            }
        }
    }

    private boolean isEscalatable(BloodRequest request) {
        return "URGENT".equalsIgnoreCase(request.getUrgency())
                || "EMERGENCY".equalsIgnoreCase(request.getUrgency());
    }
}
