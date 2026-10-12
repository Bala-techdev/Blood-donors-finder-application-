package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.dto.AcceptedDonorDTO;
import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import com.BloodDonorFinderApp.demo.entity.DonorRequestResponse;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.repository.DonorProfileRepository;
import com.BloodDonorFinderApp.demo.repository.DonorRequestResponseRepository;
import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
    private final DonorMatchingService donorMatchingService;

    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    public DonorRequestResponseService(
            DonorRequestResponseRepository responseRepository,
            BloodRequestRepository bloodRequestRepository,
            DonorProfileRepository donorProfileRepository,
            NotificationService notificationService,
            UserRepository userRepository,
            DonorMatchingService donorMatchingService
    ) {
        this.responseRepository = responseRepository;
        this.bloodRequestRepository = bloodRequestRepository;
        this.donorProfileRepository = donorProfileRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.donorMatchingService = donorMatchingService;
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
                                + " blood request. Please review the request "
                                + "details if you are available.",
                        request.getId()
                );
            }
        }

        return recommendations;
    }


    // =========================================================
    // DONOR ACCEPTS BLOOD REQUEST
    // =========================================================

    @Transactional
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

        if (request.getRequester() != null
                && request.getRequester().getId().equals(user.getId())) {
            throw new RuntimeException(
                    "You cannot respond to your own blood request"
            );
        }

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

            notificationService.createNotification(
                    request.getRequester().getId(),
                    "DONOR_ACCEPTED",
                    "Donor Accepted Your Request",
                    "A donor accepted your blood request.",
                    request.getId()
            );
        }

        // ==========================================
        // 12. KEEP THE REQUEST OPEN
        // ==========================================
        // A donor accepting means they are willing to help; it does not
        // prove that the blood donation has already happened. Keep the
        // request PENDING so it remains visible in the active requests list.
        // The requester can later mark it FULFILLED after the donation.

        // ==========================================
        // 13. RETURN RESPONSE
        // ==========================================

        return savedResponse;
    }


    // =========================================================
    // DONOR DECLINES BLOOD REQUEST
    // =========================================================

    @Transactional
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

            notificationService.createNotification(
                    request.getRequester().getId(),
                    "DONOR_DECLINED",
                    "Donor Declined Request",
                    "A donor declined your blood request.",
                    request.getId()
            );
        }

        return savedResponse;
    }


    // =========================================================
    // AI RECOMMEND SINGLE DONOR
    // =========================================================

    @Transactional
    public DonorRequestResponse recommendDonor(
            Long requestId,
            Long donorId,
            Double matchScore,
            Double distance,
            String email) {

        BloodRequest request =
                bloodRequestRepository
                        .findById(requestId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Blood request not found"
                                )
                        );

        User requester = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        if (request.getRequester() == null
                || !request.getRequester().getId().equals(requester.getId())) {
            throw new RuntimeException(
                    "You are not authorized to recommend donors for this request"
            );
        }


        DonorProfile donor =
                donorProfileRepository
                        .findById(donorId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Donor not found"
                                )
                        );

        DonorMatchingService.DonorMatchResult backendMatch =
                donorMatchingService.findBestDonors(request)
                        .stream()
                        .filter(match -> match.getDonor() != null
                                && donorId.equals(match.getDonor().getId()))
                        .findFirst()
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Donor is not currently eligible for this request"
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


        response.setMatchScore(backendMatch.getScore());

        response.setDistance(backendMatch.getDistance());


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
            Long requestId,
            String email
    ) {

        BloodRequest request = bloodRequestRepository
                .findById(requestId)
                .orElseThrow(() ->
                        new RuntimeException("Blood request not found")
                );

        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        if (request.getRequester() != null
                && request.getRequester().getId().equals(user.getId())) {

            return responseRepository.findByBloodRequestId(requestId);
        }

        DonorProfile donorProfile = donorProfileRepository
                .findByUserId(user.getId())
                .orElse(null);

        if (donorProfile == null) {
            throw new RuntimeException(
                    "You are not authorized to view this request's donor responses"
            );
        }

        return responseRepository
                .findByBloodRequestIdAndDonorId(requestId, donorProfile.getId())
                .map(List::of)
                .orElseGet(List::of);
    }


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



    // =========================================================
// GET ACCEPTED DONORS FOR THE AUTHENTICATED REQUESTER
// =========================================================

    public List<AcceptedDonorDTO> getAcceptedDonorsForRequester(
            Long requestId,
            String email
    ) {

        // 1. Find the blood request.
        BloodRequest request = bloodRequestRepository
                .findById(requestId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Blood request not found"
                        )
                );

        // 2. Verify that the authenticated user owns this request.
        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "User not found"
                        )
                );

        if (request.getRequester() == null
                || !request.getRequester()
                .getId()
                .equals(user.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not authorized to view responses for this request"
            );
        }

        // 3. Retrieve responses for this specific request.
        List<DonorRequestResponse> responses =
                responseRepository.findByBloodRequestId(requestId);

        // 4. Return only accepted donors and permitted details.
        return responses.stream()
                .filter(response ->
                        "ACCEPTED".equalsIgnoreCase(
                                response.getResponse()
                        )
                )
                .filter(response ->
                        response.getDonor() != null
                )
                .map(response -> {
                    var donor = response.getDonor();
                    var donorUser = donor.getUser();

                    return new AcceptedDonorDTO(
                            response.getId(),
                            donor.getId(),
                            donorUser != null
                                    ? donorUser.getName()
                                    : "Donor",
                            donorUser != null
                                    ? donorUser.getEmail()
                                    : null,
                            donorUser != null
                                    ? donorUser.getPhone()
                                    : null,
                            donor.getBloodGroup(),
                            donor.getLocation(),
                            donor.isAvailable(),
                            donor.isVerified(),
                            donor.getTotalDonations(),
                            response.getResponse(),
                            response.getRespondedAt()
                    );
                })
                .toList();
    }
}