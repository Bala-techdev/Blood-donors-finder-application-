package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.repository.DonorProfileRepository;
import com.BloodDonorFinderApp.demo.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class DonorService {

    private final DonorProfileRepository donorProfileRepository;
    private final UserRepository userRepository;

    private static final Set<String> VALID_BLOOD_GROUPS = Set.of(
            "A+", "A-", "B+", "B-",
            "AB+", "AB-", "O+", "O-"
    );

    public DonorService(
            DonorProfileRepository donorProfileRepository,
            UserRepository userRepository
    ) {
        this.donorProfileRepository = donorProfileRepository;
        this.userRepository = userRepository;
    }

    // ==========================================
    // CREATE DONOR
    // ==========================================

    public DonorProfile createDonor(
            DonorProfile donorProfile,
            String email
    ) {
        if (donorProfile == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Donor profile data is required"
            );
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "User not found"
                        )
                );

        // Prevent duplicate donor profiles for one user.
        if (donorProfileRepository
                .findByUserId(user.getId())
                .isPresent()) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You already have a donor profile"
            );
        }

        donorProfile.setBloodGroup(
                normalizeBloodGroup(donorProfile.getBloodGroup())
        );
        donorProfile.setLocation(
                normalizeLocation(donorProfile.getLocation())
        );
        donorProfile.setGender(
                normalizeOptionalText(donorProfile.getGender(), "Gender", 50)
        );

        if (donorProfile.getDateOfBirth() != null
                && donorProfile.getDateOfBirth().isAfter(
                java.time.LocalDate.now()
        )) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Date of birth cannot be in the future"
            );
        }

        validateCoordinates(
                donorProfile.getLatitude(),
                donorProfile.getLongitude()
        );

        // Verification, donation history, and last donation date are
        // managed by trusted workflows rather than client profile input.
        donorProfile.setVerified(false);
        donorProfile.setTotalDonations(0);
        donorProfile.setLastDonationDate(null);

        // Associate the profile with the authenticated user.
        donorProfile.setUser(user);

        return donorProfileRepository.save(donorProfile);
    }

    // ==========================================
    // GET ALL DONORS
    // ==========================================

    public List<DonorProfile> getAllDonors() {
        return donorProfileRepository.findAll();
    }

    public DonorProfile sanitizeDonorProfile(DonorProfile donorProfile) {
        if (donorProfile == null) {
            return null;
        }

        DonorProfile sanitized = new DonorProfile();
        sanitized.setId(donorProfile.getId());
        sanitized.setBloodGroup(donorProfile.getBloodGroup());
        sanitized.setGender(donorProfile.getGender());
        sanitized.setDateOfBirth(donorProfile.getDateOfBirth());
        sanitized.setLocation(donorProfile.getLocation());
        sanitized.setLatitude(donorProfile.getLatitude());
        sanitized.setLongitude(donorProfile.getLongitude());
        sanitized.setAvailable(donorProfile.isAvailable());
        sanitized.setLastDonationDate(donorProfile.getLastDonationDate());
        sanitized.setVerified(donorProfile.isVerified());
        sanitized.setTotalDonations(donorProfile.getTotalDonations());

        if (donorProfile.getUser() != null) {
            User publicUser = new User();
            publicUser.setId(donorProfile.getUser().getId());
            publicUser.setName(donorProfile.getUser().getName());
            sanitized.setUser(publicUser);
        }

        return sanitized;
    }

    // ==========================================
    // GET DONOR BY ID
    // ==========================================

    public Optional<DonorProfile> getDonorById(Long id) {
        return donorProfileRepository.findById(id);
    }

    // ==========================================
    // GET MY DONOR PROFILE
    // ==========================================

    public Optional<DonorProfile> getDonorByUserEmail(
            String email
    ) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "User not found"
                        )
                );

        return donorProfileRepository.findByUserId(
                user.getId()
        );
    }

    // ==========================================
    // UPDATE MY DONOR PROFILE
    // ==========================================

    public DonorProfile updateDonorProfile(
            String email,
            DonorProfile updatedProfile
    ) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "User not found"
                        )
                );

        DonorProfile existingProfile =
                donorProfileRepository.findByUserId(
                        user.getId()
                ).orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Donor profile not found. Create a donor profile first."
                        )
                );

        if (updatedProfile == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Donor profile data is required"
            );
        }

        // Update blood group only when supplied.
        if (updatedProfile.getBloodGroup() != null) {
            existingProfile.setBloodGroup(
                    normalizeBloodGroup(updatedProfile.getBloodGroup())
            );
        }

        // Update location only when supplied.
        if (updatedProfile.getLocation() != null) {
            existingProfile.setLocation(
                    normalizeLocation(updatedProfile.getLocation())
            );
        }

        existingProfile.setAvailable(updatedProfile.isAvailable());

        validateCoordinates(
                updatedProfile.getLatitude(),
                updatedProfile.getLongitude()
        );

        // Never replace the associated user from request data.
        return donorProfileRepository.save(existingProfile);
    }

    // ==========================================
    // VALIDATE BLOOD GROUP
    // ==========================================

    private void validateBloodGroup(String bloodGroup) {
        if (bloodGroup == null
                || !VALID_BLOOD_GROUPS.contains(
                bloodGroup.trim().toUpperCase()
        )) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid blood group. Use A+, A-, B+, B-, AB+, AB-, O+ or O-."
            );
        }
    }

    private String normalizeBloodGroup(String bloodGroup) {
        if (bloodGroup == null) {
            validateBloodGroup(null);
        }

        String normalized = bloodGroup.trim().toUpperCase();
        validateBloodGroup(normalized);
        return normalized;
    }

    private String normalizeLocation(String location) {
        if (location == null || location.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Location cannot be blank"
            );
        }

        String normalized = location.trim();
        if (normalized.length() > 200) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Location must be 200 characters or fewer"
            );
        }

        return normalized;
    }

    private String normalizeOptionalText(
            String value,
            String fieldName,
            int maxLength
    ) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        if (normalized.isEmpty()) {
            return null;
        }

        if (normalized.length() > maxLength) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    fieldName + " must be " + maxLength
                            + " characters or fewer"
            );
        }

        return normalized;
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
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Latitude and longitude must be valid coordinates"
            );
        }
    }

    // ==========================================
    // SEARCH BY BLOOD GROUP
    // ==========================================

    public List<DonorProfile> searchByBloodGroup(
            String bloodGroup
    ) {
        return donorProfileRepository
                .findByBloodGroupAndAvailableTrue(
                        bloodGroup
                );
    }

    // ==========================================
    // SEARCH BY LOCATION
    // ==========================================

    public List<DonorProfile> searchByLocation(
            String location
    ) {
        return donorProfileRepository
                .findByLocationContainingIgnoreCaseAndAvailableTrue(
                        location
                );
    }

    // ==========================================
    // SEARCH BY BLOOD GROUP + LOCATION
    // ==========================================

    public List<DonorProfile> searchDonors(
            String bloodGroup,
            String location
    ) {
        return donorProfileRepository
                .findByBloodGroupAndLocationContainingIgnoreCaseAndAvailableTrue(
                        bloodGroup,
                        location
                );
    }

    // ==========================================
    // FIND NEARBY DONORS
    // ==========================================

    public List<DonorProfile> findNearbyDonors(
            double latitude,
            double longitude,
            double radiusKm
    ) {
        if (latitude < -90 || latitude > 90
                || longitude < -180 || longitude > 180
                || radiusKm < 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid coordinates or search radius"
            );
        }

        List<DonorProfile> allDonors =
                donorProfileRepository.findAll();

        List<DonorProfile> nearbyDonors =
                new ArrayList<>();

        for (DonorProfile donor : allDonors) {

            if (!donor.isAvailable()) {
                continue;
            }

            if (donor.getLatitude() == null
                    || donor.getLongitude() == null) {
                continue;
            }

            double distance = calculateDistance(
                    latitude,
                    longitude,
                    donor.getLatitude(),
                    donor.getLongitude()
            );

            if (distance <= radiusKm) {
                nearbyDonors.add(donor);
            }
        }

        return nearbyDonors;
    }

    // ==========================================
    // HAVERSINE DISTANCE
    // ==========================================

    private double calculateDistance(
            double latitude1,
            double longitude1,
            double latitude2,
            double longitude2
    ) {
        final double EARTH_RADIUS_KM = 6371.0;

        double latDistance = Math.toRadians(
                latitude2 - latitude1
        );

        double lonDistance = Math.toRadians(
                longitude2 - longitude1
        );

        double a =
                Math.sin(latDistance / 2)
                        * Math.sin(latDistance / 2)
                        +
                        Math.cos(Math.toRadians(latitude1))
                                * Math.cos(
                                Math.toRadians(latitude2)
                        )
                                * Math.sin(lonDistance / 2)
                                * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
        );

        return EARTH_RADIUS_KM * c;
    }
}