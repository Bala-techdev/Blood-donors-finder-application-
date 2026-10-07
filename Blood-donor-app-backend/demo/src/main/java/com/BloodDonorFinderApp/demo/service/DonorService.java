package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.repository.DonorProfileRepository;
import com.BloodDonorFinderApp.demo.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class DonorService {

    private final DonorProfileRepository donorProfileRepository;
    private final UserRepository userRepository;

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

        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                )
                        );

        // Always associate the donor profile
        // with the authenticated user.
        donorProfile.setUser(user);

        return donorProfileRepository.save(
                donorProfile
        );
    }

    // ==========================================
    // GET ALL DONORS
    // ==========================================

    public List<DonorProfile> getAllDonors() {

        return donorProfileRepository.findAll();
    }

    // ==========================================
    // GET DONOR BY ID
    // ==========================================

    public Optional<DonorProfile> getDonorById(
            Long id
    ) {

        return donorProfileRepository.findById(id);
    }

    // ==========================================
    // GET MY DONOR PROFILE
    // ==========================================

    public Optional<DonorProfile> getDonorByUserEmail(
            String email
    ) {

        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                )
                        );

        return donorProfileRepository.findByUserId(
                user.getId()
        );
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

        List<DonorProfile> allDonors =
                donorProfileRepository.findAll();

        List<DonorProfile> nearbyDonors =
                new ArrayList<>();

        for (DonorProfile donor : allDonors) {

            // Only available donors
            if (!donor.isAvailable()) {
                continue;
            }

            // Skip donors without GPS coordinates
            if (donor.getLatitude() == null ||
                    donor.getLongitude() == null) {
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

        double latDistance =
                Math.toRadians(
                        latitude2 - latitude1
                );

        double lonDistance =
                Math.toRadians(
                        longitude2 - longitude1
                );

        double a =
                Math.sin(latDistance / 2)
                        * Math.sin(latDistance / 2)
                        +
                        Math.cos(
                                Math.toRadians(latitude1)
                        )
                                * Math.cos(
                                Math.toRadians(latitude2)
                        )
                                * Math.sin(
                                lonDistance / 2
                        )
                                * Math.sin(
                                lonDistance / 2
                        );

        double c =
                2 * Math.atan2(
                        Math.sqrt(a),
                        Math.sqrt(1 - a)
                );

        return EARTH_RADIUS_KM * c;
    }
}