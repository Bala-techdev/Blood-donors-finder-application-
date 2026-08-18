package com.BloodDonorFinderApp.demo.repository;

import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DonorProfileRepository extends JpaRepository<DonorProfile, Long> {

    List<DonorProfile> findByBloodGroupAndAvailableTrue(String bloodGroup);

    List<DonorProfile> findByLocationContainingIgnoreCaseAndAvailableTrue(String location);

    List<DonorProfile> findByBloodGroupAndLocationContainingIgnoreCaseAndAvailableTrue(
            String bloodGroup,
            String location
    );
}