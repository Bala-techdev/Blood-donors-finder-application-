package com.BloodDonorFinderApp.demo.repository;

import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DonorProfileRepository
        extends JpaRepository<DonorProfile, Long> {

    List<DonorProfile>
    findByBloodGroupAndAvailableTrue(
            String bloodGroup
    );

    List<DonorProfile>
    findByLocationContainingIgnoreCaseAndAvailableTrue(
            String location
    );

    List<DonorProfile>
    findByBloodGroupAndLocationContainingIgnoreCaseAndAvailableTrue(
            String bloodGroup,
            String location
    );

    // Find donor profile using the authenticated user's ID
    Optional<DonorProfile>
    findByUserId(Long userId);
}