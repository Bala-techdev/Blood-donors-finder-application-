package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BloodRequestService {

    private final BloodRequestRepository bloodRequestRepository;

    public BloodRequestService(
            BloodRequestRepository bloodRequestRepository
    ) {
        this.bloodRequestRepository = bloodRequestRepository;
    }

    public BloodRequest createRequest(BloodRequest request) {
        return bloodRequestRepository.save(request);
    }

    public List<BloodRequest> getAllRequests() {
        return bloodRequestRepository.findAll();
    }

    public Optional<BloodRequest> getRequestById(Long id) {
        return bloodRequestRepository.findById(id);
    }

    public List<BloodRequest> getRequestsByBloodGroup(
            String bloodGroup
    ) {
        return bloodRequestRepository.findByBloodGroup(bloodGroup);
    }

    public List<BloodRequest> getPendingRequests() {
        return bloodRequestRepository.findByStatus("PENDING");
    }

    public List<BloodRequest> getRequestsByUser(Long userId) {
        return bloodRequestRepository.findByRequesterId(userId);
    }

    public BloodRequest updateStatus(
            Long id,
            String status
    ) {
        BloodRequest request = bloodRequestRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Blood request not found")
                );

        request.setStatus(status);

        return bloodRequestRepository.save(request);
    }
}