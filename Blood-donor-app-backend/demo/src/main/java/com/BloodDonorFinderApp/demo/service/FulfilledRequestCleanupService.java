package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.repository.DonorRequestResponseRepository;

import org.springframework.scheduling.annotation.Scheduled;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FulfilledRequestCleanupService {

    private static final Logger logger =
            LoggerFactory.getLogger(FulfilledRequestCleanupService.class);

    private final BloodRequestRepository bloodRequestRepository;
    private final DonorRequestResponseRepository responseRepository;
    private final long retentionDays;

    public FulfilledRequestCleanupService(
            BloodRequestRepository bloodRequestRepository,
            DonorRequestResponseRepository responseRepository,
            @org.springframework.beans.factory.annotation.Value(
                    "${app.fulfillment.cleanup-retention-days:10}"
            ) long retentionDays) {
        this.bloodRequestRepository = bloodRequestRepository;
        this.responseRepository = responseRepository;
        if (retentionDays < 1) {
            throw new IllegalArgumentException(
                    "Fulfillment cleanup retention must be at least one day"
            );
        }
        this.retentionDays = retentionDays;
    }

    @Scheduled(
            fixedDelayString =
                    "${app.fulfillment.cleanup-delay-ms:3600000}"
    )
    @Transactional
    public void deleteExpiredFulfilledRequests() {

        LocalDateTime cutoff =
                LocalDateTime.now().minusDays(retentionDays);

        List<BloodRequest> expiredRequests =
                bloodRequestRepository.findByStatusAndFulfilledAtBefore(
                        "FULFILLED",
                        cutoff
                );

        for (BloodRequest request : expiredRequests) {
            if (!isEligibleForCleanup(request, cutoff)) {
                continue;
            }

            responseRepository.deleteAll(
                    responseRepository.findByBloodRequestId(request.getId())
            );

            bloodRequestRepository.delete(request);

            logger.info(
                    "Deleted fulfilled blood request {} after retention period",
                    request.getId()
            );
        }
    }

    private boolean isEligibleForCleanup(
            BloodRequest request,
            LocalDateTime cutoff
    ) {
        return request != null
                && "FULFILLED".equalsIgnoreCase(request.getStatus())
                && request.getFulfilledAt() != null
                && request.getFulfilledAt().isBefore(cutoff);
    }
}