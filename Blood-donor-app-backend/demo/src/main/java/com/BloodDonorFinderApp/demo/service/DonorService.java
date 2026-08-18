package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import com.BloodDonorFinderApp.demo.repository.DonorProfileRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DonorService {

    private final DonorProfileRepository donorProfileRepository;

    public DonorService(DonorProfileRepository donorProfileRepository) {
        this.donorProfileRepository = donorProfileRepository;
    }

    public DonorProfile createDonor(DonorProfile donorProfile) {
        return donorProfileRepository.save(donorProfile);
    }

    public List<DonorProfile> getAllDonors() {
        return donorProfileRepository.findAll();
    }

    public Optional<DonorProfile> getDonorById(Long id) {
        return donorProfileRepository.findById(id);
    }

    public List<DonorProfile> searchByBloodGroup(String bloodGroup) {
        return donorProfileRepository
                .findByBloodGroupAndAvailableTrue(bloodGroup);
    }

    public List<DonorProfile> searchByLocation(String location) {
        return donorProfileRepository
                .findByLocationContainingIgnoreCaseAndAvailableTrue(location);
    }

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
}