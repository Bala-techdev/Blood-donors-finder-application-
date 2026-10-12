package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.repository.DonorRequestResponseRepository;
import com.BloodDonorFinderApp.demo.repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;
import com.BloodDonorFinderApp.demo.entity.User;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class BloodRequestService {

    private static final Set<String> VALID_BLOOD_GROUPS = Set.of(
            "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
    );
    private static final Set<String> VALID_URGENCY_LEVELS = Set.of(
            "NORMAL", "URGENT", "EMERGENCY"
    );
    private static final Set<String> VALID_STATUSES = Set.of(
            "PENDING", "FULFILLED", "CANCELLED"
    );

    private final BloodRequestRepository bloodRequestRepository;

    private final DonorRequestResponseRepository responseRepository;

    private final DonorMatchingService donorMatchingService;

    private final DonorRequestResponseService donorRequestResponseService;

    private final UserRepository userRepository;


    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    public BloodRequestService(
            BloodRequestRepository bloodRequestRepository,
            DonorRequestResponseRepository responseRepository,
            DonorMatchingService donorMatchingService,
            DonorRequestResponseService donorRequestResponseService,
            UserRepository userRepository
    ) {

        this.bloodRequestRepository =
                bloodRequestRepository;

        this.responseRepository =
                responseRepository;

        this.donorMatchingService =
                donorMatchingService;

        this.donorRequestResponseService =
                donorRequestResponseService;

        this.userRepository =
                userRepository;
    }


    // =========================================================
    // CREATE BLOOD REQUEST
    // =========================================================

    public BloodRequest createRequest(
            BloodRequest request,
            String email
    ) {
        validateRequest(request);

        // Find the authenticated user
        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        // Never trust requester_id from frontend
        request.setRequester(user);
        request.setPatientName(request.getPatientName().trim());
        request.setBloodGroup(normalizeBloodGroup(request.getBloodGroup()));
        request.setHospitalName(request.getHospitalName().trim());
        request.setLocation(request.getLocation().trim());
        request.setUrgency(normalizeUrgency(request.getUrgency()));
        if (request.getDescription() != null) {
            request.setDescription(request.getDescription().trim());
        }
        request.setStatus("PENDING");
        request.setFulfilledAt(null);
        request.setId(null);
        request.setCreatedAt(null);

        // ==========================================
        // SAVE BLOOD REQUEST
        // ==========================================

        BloodRequest savedRequest =
                bloodRequestRepository.save(request);


        // ==========================================
        // FIND BEST DONORS AUTOMATICALLY
        // ==========================================

        try {

            List<DonorMatchingService.DonorMatchResult>
                    matches =
                    donorMatchingService.findBestDonors(
                            savedRequest
                    );


            // ==========================================
            // SAVE DONOR RECOMMENDATIONS
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
             */

            System.err.println(
                    "Automatic donor matching failed: "
                            + e.getMessage()
            );
        }


        // ==========================================
        // RETURN CREATED REQUEST
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
    // GET REQUESTS FOR AUTHENTICATED USER
    // =========================================================

    public List<BloodRequest> getRequestsByUserEmail(
            String email
    ) {

        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        return bloodRequestRepository
                .findByRequesterId(user.getId());
    }


    // =========================================================
    // UPDATE REQUEST STATUS
    // =========================================================

    public BloodRequest updateStatus(
            Long id,
            String status,
            String email
    ) {

        BloodRequest request =
                bloodRequestRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Blood request not found"
                                )
                        );

        // Find authenticated user
        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        // ==========================================
        // OWNERSHIP CHECK
        // ==========================================

        if (request.getRequester() == null ||
                !request.getRequester()
                        .getId()
                        .equals(user.getId())) {

            throw new RuntimeException(
                    "You are not allowed to modify this blood request"
            );
        }

        String nextStatus = normalizeStatus(status);
        String currentStatus = normalizeStatus(request.getStatus());

        if (currentStatus.equals("FULFILLED")
                || currentStatus.equals("CANCELLED")) {
            throw new RuntimeException(
                    "A " + currentStatus.toLowerCase()
                            + " request cannot change status"
            );
        }

        if ("PENDING".equals(nextStatus)) {
            throw new RuntimeException(
                    "A request is already pending"
            );
        }

        request.setStatus(nextStatus);
        request.setFulfilledAt(
                "FULFILLED".equals(nextStatus)
                        ? java.time.LocalDateTime.now()
                        : null
        );

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

        // Acceptance is an offer to help, not proof of donation. Fulfillment
        // must be confirmed explicitly through updateStatus by the owner.
        return request;
    }

    @Transactional
    public void deleteMyRequest(Long requestId, String email) {

        BloodRequest request = bloodRequestRepository.findById(requestId)
                .orElseThrow(() ->
                        new RuntimeException("Blood request not found"));

        if (request.getRequester() == null
                || request.getRequester().getEmail() == null
                || !request.getRequester().getEmail().equalsIgnoreCase(email)) {
            throw new RuntimeException(
                    "You are not allowed to delete this blood request");
        }

        String status = request.getStatus();

        if (!"FULFILLED".equalsIgnoreCase(status)
                && !"CANCELLED".equalsIgnoreCase(status)) {
            throw new RuntimeException(
                    "Only fulfilled or cancelled requests can be deleted");
        }

        responseRepository.deleteAll(
                responseRepository.findByBloodRequestId(requestId));

        bloodRequestRepository.delete(request);
    }

    private void validateRequest(BloodRequest request) {
        if (request == null) {
            throw new RuntimeException("Blood request data is required");
        }

        requireText(request.getPatientName(), "Patient name", 100);
        normalizeBloodGroup(request.getBloodGroup());
        if (request.getUnits() == null
                || request.getUnits() < 1
                || request.getUnits() > 10) {
            throw new RuntimeException("Units must be between 1 and 10");
        }
        requireText(request.getHospitalName(), "Hospital name", 200);
        requireText(request.getLocation(), "Location", 200);
        normalizeUrgency(request.getUrgency());

        if (request.getRequiredDate() == null
                || request.getRequiredDate().isBefore(
                java.time.LocalDate.now()
        )) {
            throw new RuntimeException(
                    "Required date must be today or a future date"
            );
        }

        if (request.getDescription() != null
                && request.getDescription().trim().length() > 1000) {
            throw new RuntimeException(
                    "Description must be 1000 characters or fewer"
            );
        }

        validateCoordinates(request.getLatitude(), request.getLongitude());
    }

    private String normalizeBloodGroup(String bloodGroup) {
        if (bloodGroup == null) {
            throw new RuntimeException("Blood group is required");
        }

        String normalized = bloodGroup.trim().toUpperCase();
        if (!VALID_BLOOD_GROUPS.contains(normalized)) {
            throw new RuntimeException("Invalid blood group");
        }
        return normalized;
    }

    private String normalizeUrgency(String urgency) {
        if (urgency == null) {
            throw new RuntimeException("Urgency is required");
        }

        String normalized = urgency.trim().toUpperCase();
        if (!VALID_URGENCY_LEVELS.contains(normalized)) {
            throw new RuntimeException("Invalid urgency level");
        }
        return normalized;
    }

    private String normalizeStatus(String status) {
        if (status == null) {
            throw new RuntimeException("Request status is required");
        }

        String normalized = status.trim().toUpperCase();
        if (!VALID_STATUSES.contains(normalized)) {
            throw new RuntimeException("Invalid request status");
        }
        return normalized;
    }

    private void requireText(String value, String field, int maxLength) {
        if (value == null || value.trim().isEmpty()) {
            throw new RuntimeException(field + " is required");
        }
        if (value.trim().length() > maxLength) {
            throw new RuntimeException(
                    field + " must be " + maxLength + " characters or fewer"
            );
        }
    }

    private void validateCoordinates(Double latitude, Double longitude) {
        if (latitude == null && longitude == null) {
            return;
        }
        if (latitude == null || longitude == null
                || !Double.isFinite(latitude)
                || !Double.isFinite(longitude)
                || latitude < -90 || latitude > 90
                || longitude < -180 || longitude > 180) {
            throw new RuntimeException(
                    "Latitude and longitude must be valid coordinates"
            );
        }
    }
}