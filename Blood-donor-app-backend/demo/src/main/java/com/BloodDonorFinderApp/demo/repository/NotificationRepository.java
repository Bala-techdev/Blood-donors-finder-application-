package com.BloodDonorFinderApp.demo.repository;

import com.BloodDonorFinderApp.demo.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification>
    findByUserIdOrderByCreatedAtDesc(
            Long userId
    );

    Page<Notification> findByUserIdOrderByCreatedAtDesc(
            Long userId,
            Pageable pageable
    );

    boolean existsByUserIdAndTypeAndRequestId(
            Long userId,
            String type,
            Long requestId
    );

    Optional<Notification>
    findFirstByUserIdAndTypeAndRequestIdOrderByCreatedAtDesc(
            Long userId,
            String type,
            Long requestId
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