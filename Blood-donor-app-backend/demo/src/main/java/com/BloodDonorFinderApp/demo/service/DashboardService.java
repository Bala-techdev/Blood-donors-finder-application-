package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.dto.DashboardStats;
import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.repository.*;
import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.Notification;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final DonorProfileRepository donorProfileRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final DonorRequestResponseRepository responseRepository;
    private final NotificationRepository notificationRepository;

    public DashboardService(
            UserRepository userRepository,
            DonorProfileRepository donorProfileRepository,
            BloodRequestRepository bloodRequestRepository,
            DonorRequestResponseRepository responseRepository,
            NotificationRepository notificationRepository
    ) {
        this.userRepository = userRepository;
        this.donorProfileRepository = donorProfileRepository;
        this.bloodRequestRepository = bloodRequestRepository;
        this.responseRepository = responseRepository;
        this.notificationRepository = notificationRepository;
    }

    public DashboardStats getStats(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<BloodRequest> requests =
                bloodRequestRepository.findByRequesterId(user.getId());

        long pending = requests.stream()
                .filter(request -> "PENDING".equalsIgnoreCase(request.getStatus()))
                .count();
        long fulfilled = requests.stream()
                .filter(request -> "FULFILLED".equalsIgnoreCase(request.getStatus()))
                .count();

        DonorProfile profile = donorProfileRepository.findByUserId(user.getId())
                .orElse(null);
        int completion = profile == null ? 0 : profileCompletion(profile);

        List<Notification> notifications =
                notificationRepository.findByUserIdOrderByCreatedAtDesc(
                        user.getId(),
                        PageRequest.of(
                                0,
                                5,
                                Sort.by(Sort.Direction.DESC, "createdAt")
                        )
                ).getContent();

        return new DashboardStats(
                donorProfileRepository.count(),
                requests.size(),
                pending,
                fulfilled,
                profile == null
                        ? 0
                        : responseRepository
                        .countByDonorIdAndResponse(profile.getId(), "ACCEPTED"),
                completion,
                notificationRepository.countByUserIdAndReadFalse(user.getId()),
                requests,
                notifications
        );
    }

    private int profileCompletion(DonorProfile profile) {
        int completed = 0;
        if (hasText(profile.getBloodGroup())) completed++;
        if (hasText(profile.getLocation())) completed++;
        if (profile.getDateOfBirth() != null) completed++;
        if (profile.getLatitude() != null && profile.getLongitude() != null) {
            completed++;
        }
        return completed * 25;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
