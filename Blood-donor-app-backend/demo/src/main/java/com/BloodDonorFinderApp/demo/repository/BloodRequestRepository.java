package com.BloodDonorFinderApp.demo.repository;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BloodRequestRepository extends JpaRepository<BloodRequest, Long> {

    List<BloodRequest> findByBloodGroup(String bloodGroup);

    List<BloodRequest> findByStatus(String status);

    List<BloodRequest> findByBloodGroupAndStatus(
            String bloodGroup,
            String status
    );

    List<BloodRequest> findByRequesterId(Long requesterId);
}