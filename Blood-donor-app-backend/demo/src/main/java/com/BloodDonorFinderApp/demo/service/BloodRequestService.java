package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.repository.DonorRequestResponseRepository;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BloodRequestService {

    private final BloodRequestRepository bloodRequestRepository;

    private final DonorRequestResponseRepository responseRepository;

    private final DonorMatchingService donorMatchingService;

    private final DonorRequestResponseService
            donorRequestResponseService;


    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    public BloodRequestService(
            BloodRequestRepository bloodRequestRepository,
            DonorRequestResponseRepository responseRepository,
            DonorMatchingService donorMatchingService,
            DonorRequestResponseService donorRequestResponseService
    ) {

        this.bloodRequestRepository =
                bloodRequestRepository;

        this.responseRepository =
                responseRepository;

        this.donorMatchingService =
                donorMatchingService;

        this.donorRequestResponseService =
                donorRequestResponseService;
    }


    // =========================================================
    // CREATE BLOOD REQUEST
    // =========================================================

    public BloodRequest createRequest(
            BloodRequest request
    ) {

        // ==========================================
        // 1. SAVE BLOOD REQUEST
        // ==========================================

        BloodRequest savedRequest =
                bloodRequestRepository.save(request);


        // ==========================================
        // 2. FIND BEST DONORS AUTOMATICALLY
        // ==========================================

        try {

            List<DonorMatchingService.DonorMatchResult>
                    matches =
                    donorMatchingService.findBestDonors(
                            savedRequest
                    );


            // ==========================================
            // 3. SAVE DONOR RECOMMENDATIONS
            // ==========================================

            if (!matches.isEmpty()) {

                donorRequestResponseService
                        .saveRecommendedDonors(
                                savedRequest,
                                matches
                        );
            }


        } catch (Exception e) {

            /*
             * Blood request creation should not fail
             * just because donor matching or ML
             * processing has an issue.
             *
             * The request is already safely saved.
             */

            System.err.println(
                    "Automatic donor matching failed: "
                            + e.getMessage()
            );
        }


        // ==========================================
        // 4. RETURN CREATED REQUEST
        // ==========================================

        return savedRequest;
    }


    // =========================================================
    // GET ALL REQUESTS
    // =========================================================

    public List<BloodRequest> getAllRequests() {

        return bloodRequestRepository.findAll();
    }


    // =========================================================
    // GET REQUEST BY ID
    // =========================================================

    public Optional<BloodRequest> getRequestById(
            Long id
    ) {

        return bloodRequestRepository.findById(id);
    }


    // =========================================================
    // GET REQUESTS BY BLOOD GROUP
    // =========================================================

    public List<BloodRequest> getRequestsByBloodGroup(
            String bloodGroup
    ) {

        return bloodRequestRepository
                .findByBloodGroup(bloodGroup);
    }


    // =========================================================
    // GET PENDING REQUESTS
    // =========================================================

    public List<BloodRequest> getPendingRequests() {

        return bloodRequestRepository
                .findByStatus("PENDING");
    }


    // =========================================================
    // GET REQUESTS BY USER
    // =========================================================

    public List<BloodRequest> getRequestsByUser(
            Long userId
    ) {

        return bloodRequestRepository
                .findByRequesterId(userId);
    }


    // =========================================================
    // UPDATE REQUEST STATUS
    // =========================================================

    public BloodRequest updateStatus(
            Long id,
            String status
    ) {

        BloodRequest request =
                bloodRequestRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Blood request not found"
                                )
                        );

        request.setStatus(status);

        return bloodRequestRepository.save(request);
    }


    // =========================================================
    // CHECK AND UPDATE FULFILLMENT
    // =========================================================

    public BloodRequest checkAndUpdateFulfillment(
            Long requestId
    ) {

        BloodRequest request =
                bloodRequestRepository
                        .findById(requestId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Blood request not found"
                                )
                        );


        // ==========================================
        // COUNT ACCEPTED DONORS
        // ==========================================

        long acceptedDonors =
                responseRepository
                        .countByBloodRequestIdAndResponse(
                                requestId,
                                "ACCEPTED"
                        );


        // ==========================================
        // REQUIRED UNITS
        // ==========================================

        int requiredUnits =
                request.getUnits() == null
                        ? 1
                        : request.getUnits();


        // ==========================================
        // FULFILLMENT
        // ==========================================

        if (acceptedDonors >= requiredUnits) {

            request.setStatus("FULFILLED");

            return bloodRequestRepository
                    .save(request);
        }


        return request;
    }
}