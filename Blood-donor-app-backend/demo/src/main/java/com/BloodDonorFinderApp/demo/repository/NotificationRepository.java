package com.BloodDonorFinderApp.demo.repository;

import com.BloodDonorFinderApp.demo.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification>
    findByUserIdOrderByCreatedAtDesc(
            Long userId
    );

    List<Notification>
    findByUserIdAndReadFalseOrderByCreatedAtDesc(
            Long userId
    );

    long countByUserIdAndReadFalse(
            Long userId
    );

    void deleteByUserId(
            Long userId
    );
}