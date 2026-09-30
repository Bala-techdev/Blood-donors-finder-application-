//package com.BloodDonorFinderApp.demo.service;
//
//import com.BloodDonorFinderApp.demo.entity.BloodRequest;
//import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
//import org.springframework.stereotype.Service;
//
//import java.util.List;
//import java.util.Optional;
//
//@Service
//public class BloodRequestService {
//
//    private final BloodRequestRepository bloodRequestRepository;
//
//    public BloodRequestService(
//            BloodRequestRepository bloodRequestRepository
//    ) {
//        this.bloodRequestRepository = bloodRequestRepository;
//    }
//
//    public BloodRequest createRequest(BloodRequest request) {
//        return bloodRequestRepository.save(request);
//    }
//
//    public List<BloodRequest> getAllRequests() {
//        return bloodRequestRepository.findAll();
//    }
//
//    public Optional<BloodRequest> getRequestById(Long id) {
//        return bloodRequestRepository.findById(id);
//    }
//
//    public List<BloodRequest> getRequestsByBloodGroup(
//            String bloodGroup
//    ) {
//        return bloodRequestRepository.findByBloodGroup(bloodGroup);
//    }
//
//    public List<BloodRequest> getPendingRequests() {
//        return bloodRequestRepository.findByStatus("PENDING");
//    }
//
//    public List<BloodRequest> getRequestsByUser(Long userId) {
//        return bloodRequestRepository.findByRequesterId(userId);
//    }
//
//    public BloodRequest updateStatus(
//            Long id,
//            String status
//    ) {
//        BloodRequest request = bloodRequestRepository
//                .findById(id)
//                .orElseThrow(() ->
//                        new RuntimeException("Blood request not found")
//                );
//
//        request.setStatus(status);
//
//        return bloodRequestRepository.save(request);
//    }
//}

package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.repository.DonorRequestResponseRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BloodRequestService {

    private final BloodRequestRepository bloodRequestRepository;
    private final DonorRequestResponseRepository responseRepository;

    public BloodRequestService(
            BloodRequestRepository bloodRequestRepository,
            DonorRequestResponseRepository responseRepository
    ) {
        this.bloodRequestRepository = bloodRequestRepository;
        this.responseRepository = responseRepository;
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

    public BloodRequest checkAndUpdateFulfillment(
            Long requestId
    ) {
        BloodRequest request = bloodRequestRepository
                .findById(requestId)
                .orElseThrow(() ->
                        new RuntimeException("Blood request not found")
                );

        long acceptedDonors = responseRepository
                .countByBloodRequestIdAndResponse(
                        requestId,
                        "ACCEPTED"
                );

        int requiredUnits = request.getUnits() == null
                ? 1
                : request.getUnits();

        if (acceptedDonors >= requiredUnits) {
            request.setStatus("FULFILLED");
            return bloodRequestRepository.save(request);
        }

        return request;
    }
}