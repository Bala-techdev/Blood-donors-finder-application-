package com.BloodDonorFinderApp.demo.dto;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.Notification;

import java.util.List;

public record DashboardStats(
        long donorCount,
        long totalRequests,
        long pendingRequests,
        long fulfilledRequests,
        long acceptedResponses,
        int profileCompletionPercent,
        long unreadNotifications,
        List<BloodRequest> requests,
        List<Notification> recentNotifications
) {
}
