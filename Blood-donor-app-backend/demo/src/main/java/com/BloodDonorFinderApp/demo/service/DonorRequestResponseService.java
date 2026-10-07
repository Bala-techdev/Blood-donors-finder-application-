package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import com.BloodDonorFinderApp.demo.entity.DonorRequestResponse;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.repository.DonorProfileRepository;
import com.BloodDonorFinderApp.demo.repository.DonorRequestResponseRepository;
import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.repository.UserRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class DonorRequestResponseService {

    private final DonorRequestResponseRepository responseRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final DonorProfileRepository donorProfileRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    public DonorRequestResponseService(
            DonorRequestResponseRepository responseRepository,
            BloodRequestRepository bloodRequestRepository,
            DonorProfileRepository donorProfileRepository,
            NotificationService notificationService,
            UserRepository userRepository
    ) {
        this.responseRepository = responseRepository;
        this.bloodRequestRepository = bloodRequestRepository;
        this.donorProfileRepository = donorProfileRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }


    // =========================================================
    // SAVE SMART AI DONOR RECOMMENDATIONS
    // =========================================================

    public List<DonorRequestResponse> saveRecommendedDonors(
            BloodRequest request,
            List<DonorMatchingService.DonorMatchResult> matches) {

        List<DonorRequestResponse> recommendations =
                new ArrayList<>();

        for (DonorMatchingService.DonorMatchResult match : matches) {

            DonorProfile donor = match.getDonor();

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

            recommendation.setBloodRequest(request);

            recommendation.setDonor(donor);

            recommendation.setResponse("PENDING");

            recommendation.setMatchScore(match.getScore());

            recommendation.setDistance(match.getDistance());

            recommendation.setRecommendedAt(LocalDateTime.now());

            DonorRequestResponse savedRecommendation =
                    responseRepository.save(recommendation);

            recommendations.add(savedRecommendation);

            // ------------------------------------------
            // NOTIFY DONOR
            // ------------------------------------------

            if (donor.getUser() != null) {

                notificationService.createNotification(
                        donor.getUser().getId(),
                        "DONOR_RECOMMENDATION",
                        "New Blood Request",
                        "You have been recommended for a "
                                + request.getBloodGroup()
                                + " blood request for "
                                + request.getPatientName()
                                + " at "
                                + request.getHospitalName()
                                + ".",
                        request.getId()
                );
            }
        }

        return recommendations;
    }


    // =========================================================
    // DONOR ACCEPTS BLOOD REQUEST
    // =========================================================

    public DonorRequestResponse respondToRequest(
            Long requestId,
            String email
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

        if (!"PENDING".equalsIgnoreCase(
                request.getStatus()
        )) {

            throw new RuntimeException(
                    "This blood request is no longer accepting responses"
            );
        }

        // ==========================================
        // 3. FIND AUTHENTICATED USER
        // ==========================================

        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                )
                        );

        // ==========================================
        // 4. FIND DONOR PROFILE
        // ==========================================

        DonorProfile donor =
                donorProfileRepository
                        .findByUserId(user.getId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Donor profile not found for this user"
                                )
                        );

        // ==========================================
        // 5. CHECK DONOR AVAILABILITY
        // ==========================================

        if (!donor.isAvailable()) {

            throw new RuntimeException(
                    "You are currently unavailable for donation"
            );
        }

        // ==========================================
        // 6. FIND EXISTING RECOMMENDATION
        // ==========================================

        DonorRequestResponse response =
                responseRepository
                        .findByBloodRequestIdAndDonorId(
                                requestId,
                                donor.getId()
                        )
                        .orElse(null);

        // ==========================================
        // 7. CREATE RESPONSE IF NOT RECOMMENDED
        // ==========================================

        if (response == null) {

            response =
                    new DonorRequestResponse();

            response.setBloodRequest(request);
            response.setDonor(donor);

            response.setMatchScore(0.0);
            response.setDistance(999.0);

            response.setRecommendedAt(
                    LocalDateTime.now()
            );

            response.setResponse("PENDING");
        }

        // ==========================================
        // 8. PREVENT DUPLICATE RESPONSE
        // ==========================================

        if ("ACCEPTED".equalsIgnoreCase(
                response.getResponse()
        )) {

            throw new RuntimeException(
                    "You have already accepted this request"
            );
        }

        if ("DECLINED".equalsIgnoreCase(
                response.getResponse()
        )) {

            throw new RuntimeException(
                    "You have already declined this request"
            );
        }

        // ==========================================
        // 9. ACCEPT REQUEST
        // ==========================================

        response.setResponse("ACCEPTED");

        response.setRespondedAt(
                LocalDateTime.now()
        );

        // ==========================================
        // 10. SAVE DONOR RESPONSE
        // ==========================================

        DonorRequestResponse savedResponse =
                responseRepository.save(response);

        // ==========================================
        // 11. NOTIFY REQUESTER
        // ==========================================

        if (request.getRequester() != null) {

            String donorName =
                    donor.getUser() != null
                            ? donor.getUser().getName()
                            : "A donor";

            notificationService.createNotification(
                    request.getRequester().getId(),
                    "DONOR_ACCEPTED",
                    "Donor Accepted Your Request",
                    donorName
                            + " accepted your blood request for "
                            + request.getPatientName()
                            + ".",
                    request.getId()
            );
        }

        // ==========================================
        // 12. CHECK AUTOMATIC FULFILLMENT
        // ==========================================

        checkAndUpdateFulfillment(request);

        // ==========================================
        // 13. RETURN RESPONSE
        // ==========================================

        return savedResponse;
    }


    // =========================================================
    // AUTOMATIC FULFILLMENT CHECK
    // =========================================================

    private void checkAndUpdateFulfillment(
            BloodRequest request) {

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

        if (acceptedCount >= requiredUnits) {

            // Prevent duplicate fulfillment notification
            boolean wasAlreadyFulfilled =
                    "FULFILLED".equalsIgnoreCase(
                            request.getStatus()
                    );

            request.setStatus("FULFILLED");

            bloodRequestRepository.save(request);

            // ------------------------------------------
            // NOTIFY REQUESTER
            // ------------------------------------------

            if (!wasAlreadyFulfilled
                    && request.getRequester() != null) {

                notificationService.createNotification(
                        request.getRequester().getId(),
                        "REQUEST_FULFILLED",
                        "Blood Request Fulfilled",
                        "Your blood request for "
                                + request.getPatientName()
                                + " has been fulfilled.",
                        request.getId()
                );
            }
        }
    }


    // =========================================================
    // DONOR DECLINES BLOOD REQUEST
    // =========================================================

    public DonorRequestResponse declineRequest(
            Long requestId,
            String email
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

        if (!"PENDING".equalsIgnoreCase(
                request.getStatus()
        )) {

            throw new RuntimeException(
                    "This blood request is no longer accepting responses"
            );
        }

        // ==========================================
        // 3. FIND AUTHENTICATED USER
        // ==========================================

        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                )
                        );

        // ==========================================
        // 4. FIND DONOR PROFILE
        // ==========================================

        DonorProfile donor =
                donorProfileRepository
                        .findByUserId(user.getId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Donor profile not found for this user"
                                )
                        );

        // ==========================================
        // 5. FIND RECOMMENDATION
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
        // 6. CHECK ALREADY RESPONDED
        // ==========================================

        if ("ACCEPTED".equalsIgnoreCase(
                response.getResponse()
        )) {

            throw new RuntimeException(
                    "You have already accepted this request"
            );
        }

        if ("DECLINED".equalsIgnoreCase(
                response.getResponse()
        )) {

            throw new RuntimeException(
                    "You have already declined this request"
            );
        }

        // ==========================================
        // 7. DECLINE REQUEST
        // ==========================================

        response.setResponse("DECLINED");

        response.setRespondedAt(
                LocalDateTime.now()
        );

        // ==========================================
        // 8. SAVE
        // ==========================================

        DonorRequestResponse savedResponse =
                responseRepository.save(response);

        // ==========================================
        // 9. NOTIFY REQUESTER
        // ==========================================

        if (request.getRequester() != null) {

            String donorName =
                    donor.getUser() != null
                            ? donor.getUser().getName()
                            : "A donor";

            notificationService.createNotification(
                    request.getRequester().getId(),
                    "DONOR_DECLINED",
                    "Donor Declined Request",
                    donorName
                            + " declined your blood request for "
                            + request.getPatientName()
                            + ".",
                    request.getId()
            );
        }

        return savedResponse;
    }


    // =========================================================
    // AI RECOMMEND SINGLE DONOR
    // =========================================================

    public DonorRequestResponse recommendDonor(
            Long requestId,
            Long donorId,
            Double matchScore,
            Double distance) {

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


        // Keep track of whether this is a new recommendation
        boolean newRecommendation = false;


        if (response == null) {

            response = new DonorRequestResponse();

            response.setBloodRequest(request);

            response.setDonor(donor);

            response.setResponse("PENDING");

            response.setRecommendedAt(LocalDateTime.now());

            newRecommendation = true;
        }


        response.setMatchScore(matchScore);

        response.setDistance(distance);


        // ==========================================
        // SAVE
        // ==========================================

        DonorRequestResponse savedResponse =
                responseRepository.save(response);


        // ==========================================
        // NOTIFY DONOR ONLY FOR NEW RECOMMENDATION
        // ==========================================

        if (newRecommendation
                && donor.getUser() != null) {

            notificationService.createNotification(
                    donor.getUser().getId(),
                    "DONOR_RECOMMENDATION",
                    "New Blood Request",
                    "You have been recommended for a "
                            + request.getBloodGroup()
                            + " blood request for "
                            + request.getPatientName()
                            + " at "
                            + request.getHospitalName()
                            + ".",
                    request.getId()
            );
        }


        return savedResponse;
    }


    // =========================================================
    // GET RESPONSES FOR BLOOD REQUEST
    // =========================================================

    public List<DonorRequestResponse>
    getResponsesForRequest(
            Long requestId) {

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
            Long donorId) {

        return responseRepository
                .findByDonorId(
                        donorId
                );
    }

    public List<DonorRequestResponse> getResponsesByUserEmail(String email) {

        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        DonorProfile donor = donorProfileRepository
                .findByUserId(user.getId())
                .orElseThrow(() ->
                        new RuntimeException("Donor profile not found")
                );

        return responseRepository.findByDonorId(donor.getId());
    }
}