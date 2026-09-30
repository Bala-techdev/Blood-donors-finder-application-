package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import com.BloodDonorFinderApp.demo.entity.DonorRequestResponse;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.repository.DonorProfileRepository;
import com.BloodDonorFinderApp.demo.repository.DonorRequestResponseRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class DonorRequestResponseService {

    private final DonorRequestResponseRepository responseRepository;

    private final BloodRequestRepository bloodRequestRepository;

    private final DonorProfileRepository donorProfileRepository;


    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    public DonorRequestResponseService(
            DonorRequestResponseRepository responseRepository,
            BloodRequestRepository bloodRequestRepository,
            DonorProfileRepository donorProfileRepository
    ) {
        this.responseRepository =
                responseRepository;

        this.bloodRequestRepository =
                bloodRequestRepository;

        this.donorProfileRepository =
                donorProfileRepository;
    }


    // =========================================================
    // SAVE SMART AI DONOR RECOMMENDATIONS
    // =========================================================

    public List<DonorRequestResponse> saveRecommendedDonors(
            BloodRequest request,
            List<DonorMatchingService.DonorMatchResult> matches
    ) {

        List<DonorRequestResponse> recommendations =
                new ArrayList<>();


        for (
                DonorMatchingService.DonorMatchResult match
                : matches
        ) {

            DonorProfile donor =
                    match.getDonor();


            // ------------------------------------------
            // CHECK DUPLICATE RECOMMENDATION
            // ------------------------------------------

            boolean alreadyExists =
                    responseRepository
                            .findByBloodRequestIdAndDonorId(
                                    request.getId(),
                                    donor.getId()
                            )
                            .isPresent();


            if (alreadyExists) {
                continue;
            }


            // ------------------------------------------
            // CREATE RECOMMENDATION
            // ------------------------------------------

            DonorRequestResponse recommendation =
                    new DonorRequestResponse();


            recommendation.setBloodRequest(
                    request
            );

            recommendation.setDonor(
                    donor
            );

            recommendation.setResponse(
                    "PENDING"
            );

            recommendation.setMatchScore(
                    match.getScore()
            );

            recommendation.setDistance(
                    match.getDistance()
            );

            recommendation.setRecommendedAt(
                    LocalDateTime.now()
            );


            recommendations.add(
                    responseRepository.save(
                            recommendation
                    )
            );
        }


        return recommendations;
    }


    // =========================================================
    // DONOR ACCEPTS BLOOD REQUEST
    // =========================================================

    public DonorRequestResponse respondToRequest(
            Long requestId,
            Long userId
    ) {

        // ==========================================
        // 1. FIND BLOOD REQUEST
        // ==========================================

        BloodRequest request =
                bloodRequestRepository
                        .findById(requestId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Blood request not found"
                                )
                        );


        // ==========================================
        // 2. CHECK REQUEST STATUS
        // ==========================================

        if (
                !"PENDING".equalsIgnoreCase(
                        request.getStatus()
                )
        ) {

            throw new RuntimeException(
                    "This blood request is no longer accepting responses"
            );
        }


        // ==========================================
        // 3. FIND DONOR PROFILE
        // ==========================================

        DonorProfile donor =
                donorProfileRepository
                        .findByUserId(userId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Donor profile not found for this user"
                                )
                        );


        // ==========================================
        // 4. CHECK DONOR AVAILABILITY
        // ==========================================

        if (!donor.isAvailable()) {

            throw new RuntimeException(
                    "You are currently unavailable for donation"
            );
        }


        // ==========================================
        // 5. FIND EXISTING RECOMMENDATION
        // ==========================================

        DonorRequestResponse response =
                responseRepository
                        .findByBloodRequestIdAndDonorId(
                                requestId,
                                donor.getId()
                        )
                        .orElse(null);


        // ==========================================
        // 6. CREATE RESPONSE IF NOT RECOMMENDED
        // ==========================================

        if (response == null) {

            response =
                    new DonorRequestResponse();

            response.setBloodRequest(
                    request
            );

            response.setDonor(
                    donor
            );

            response.setMatchScore(
                    0.0
            );

            response.setDistance(
                    999.0
            );

            response.setRecommendedAt(
                    LocalDateTime.now()
            );

            response.setResponse(
                    "PENDING"
            );
        }


        // ==========================================
        // 7. PREVENT DUPLICATE RESPONSE
        // ==========================================

        if (
                "ACCEPTED".equalsIgnoreCase(
                        response.getResponse()
                )
        ) {

            throw new RuntimeException(
                    "You have already accepted this request"
            );
        }


        if (
                "DECLINED".equalsIgnoreCase(
                        response.getResponse()
                )
        ) {

            throw new RuntimeException(
                    "You have already declined this request"
            );
        }


        // ==========================================
        // 8. ACCEPT REQUEST
        // ==========================================

        response.setResponse(
                "ACCEPTED"
        );

        response.setRespondedAt(
                LocalDateTime.now()
        );


        // ==========================================
        // 9. SAVE DONOR RESPONSE
        // ==========================================

        DonorRequestResponse savedResponse =
                responseRepository.save(
                        response
                );


        // ==========================================
        // 10. CHECK AUTOMATIC FULFILLMENT
        // ==========================================

        checkAndUpdateFulfillment(
                request
        );


        // ==========================================
        // 11. RETURN RESPONSE
        // ==========================================

        return savedResponse;
    }


    // =========================================================
    // AUTOMATIC FULFILLMENT CHECK
    // =========================================================

    private void checkAndUpdateFulfillment(
            BloodRequest request
    ) {

        // ------------------------------------------
        // COUNT ACCEPTED DONORS
        // ------------------------------------------

        long acceptedCount =
                responseRepository
                        .countByBloodRequestIdAndResponse(
                                request.getId(),
                                "ACCEPTED"
                        );


        // ------------------------------------------
        // REQUIRED UNITS
        // ------------------------------------------

        int requiredUnits =
                request.getUnits() == null
                        ? 1
                        : request.getUnits();


        // ------------------------------------------
        // FULFILLMENT CHECK
        //
        // DEMO RULE:
        // 1 ACCEPTED DONOR = 1 UNIT
        // ------------------------------------------

        if (
                acceptedCount >= requiredUnits
        ) {

            request.setStatus(
                    "FULFILLED"
            );

            bloodRequestRepository.save(
                    request
            );
        }
    }


    // =========================================================
    // DONOR DECLINES BLOOD REQUEST
    // =========================================================

    public DonorRequestResponse declineRequest(
            Long requestId,
            Long userId
    ) {

        // ==========================================
        // 1. FIND BLOOD REQUEST
        // ==========================================

        BloodRequest request =
                bloodRequestRepository
                        .findById(requestId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Blood request not found"
                                )
                        );


        // ==========================================
        // 2. CHECK REQUEST STATUS
        // ==========================================

        if (
                !"PENDING".equalsIgnoreCase(
                        request.getStatus()
                )
        ) {

            throw new RuntimeException(
                    "This blood request is no longer accepting responses"
            );
        }


        // ==========================================
        // 3. FIND DONOR PROFILE
        // ==========================================

        DonorProfile donor =
                donorProfileRepository
                        .findByUserId(userId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Donor profile not found for this user"
                                )
                        );


        // ==========================================
        // 4. FIND RECOMMENDATION
        // ==========================================

        DonorRequestResponse response =
                responseRepository
                        .findByBloodRequestIdAndDonorId(
                                requestId,
                                donor.getId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "No recommendation found for this donor"
                                )
                        );


        // ==========================================
        // 5. CHECK ALREADY RESPONDED
        // ==========================================

        if (
                "ACCEPTED".equalsIgnoreCase(
                        response.getResponse()
                )
        ) {

            throw new RuntimeException(
                    "You have already accepted this request"
            );
        }


        if (
                "DECLINED".equalsIgnoreCase(
                        response.getResponse()
                )
        ) {

            throw new RuntimeException(
                    "You have already declined this request"
            );
        }


        // ==========================================
        // 6. DECLINE REQUEST
        // ==========================================

        response.setResponse(
                "DECLINED"
        );

        response.setRespondedAt(
                LocalDateTime.now()
        );


        // ==========================================
        // 7. SAVE
        // ==========================================

        return responseRepository.save(
                response
        );
    }


    // =========================================================
    // AI RECOMMEND SINGLE DONOR
    // =========================================================

    public DonorRequestResponse recommendDonor(
            Long requestId,
            Long donorId,
            Double matchScore,
            Double distance
    ) {

        BloodRequest request =
                bloodRequestRepository
                        .findById(requestId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Blood request not found"
                                )
                        );


        DonorProfile donor =
                donorProfileRepository
                        .findById(donorId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Donor not found"
                                )
                        );


        DonorRequestResponse response =
                responseRepository
                        .findByBloodRequestIdAndDonorId(
                                requestId,
                                donorId
                        )
                        .orElse(null);


        if (response == null) {

            response =
                    new DonorRequestResponse();

            response.setBloodRequest(
                    request
            );

            response.setDonor(
                    donor
            );

            response.setResponse(
                    "PENDING"
            );

            response.setRecommendedAt(
                    LocalDateTime.now()
            );
        }


        response.setMatchScore(
                matchScore
        );

        response.setDistance(
                distance
        );


        return responseRepository.save(
                response
        );
    }


    // =========================================================
    // GET RESPONSES FOR BLOOD REQUEST
    // =========================================================

    public List<DonorRequestResponse>
    getResponsesForRequest(
            Long requestId
    ) {

        return responseRepository
                .findByBloodRequestId(
                        requestId
                );
    }


    // =========================================================
    // GET RESPONSES BY DONOR
    // =========================================================

    public List<DonorRequestResponse>
    getResponsesByDonor(
            Long donorId
    ) {

        return responseRepository
                .findByDonorId(
                        donorId
                );
    }
}