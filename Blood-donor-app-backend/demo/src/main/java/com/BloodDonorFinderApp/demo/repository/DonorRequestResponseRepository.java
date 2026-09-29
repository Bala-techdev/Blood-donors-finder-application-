package com.BloodDonorFinderApp.demo.repository;

import com.BloodDonorFinderApp.demo.entity.DonorRequestResponse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DonorRequestResponseRepository
        extends JpaRepository<DonorRequestResponse, Long> {


    // ==========================================
    // CHECK EXISTING DONOR RESPONSE
    // ==========================================

    Optional<DonorRequestResponse>
    findByBloodRequestIdAndDonorId(
            Long requestId,
            Long donorId
    );


    // ==========================================
    // GET ALL RECOMMENDED DONORS
    // ==========================================

    List<DonorRequestResponse>
    findByBloodRequestId(
            Long requestId
    );


    // ==========================================
    // GET DONOR RESPONSES
    // ==========================================

    List<DonorRequestResponse>
    findByDonorId(
            Long donorId
    );


    // ==========================================
    // GET RESPONSES BY STATUS
    // ==========================================

    List<DonorRequestResponse>
    findByBloodRequestIdAndResponse(
            Long requestId,
            String response
    );


    // ==========================================
    // GET ACCEPTED DONORS
    // ==========================================

    List<DonorRequestResponse>
    findByBloodRequestIdAndResponseOrderByMatchScoreDesc(
            Long requestId,
            String response
    );


    // ==========================================
    // COUNT ACCEPTED DONORS
    // ==========================================

    long countByBloodRequestIdAndResponse(
            Long requestId,
            String response
    );

}