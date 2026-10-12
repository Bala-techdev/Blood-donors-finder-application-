package com.BloodDonorFinderApp.demo.repository;

import com.BloodDonorFinderApp.demo.entity.EmergencyEscalationEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface EmergencyEscalationEventRepository
        extends JpaRepository<EmergencyEscalationEvent, Long> {

    long countByRequestId(Long requestId);

    Optional<EmergencyEscalationEvent>
    findByRequestIdAndEscalationLevel(
            Long requestId,
            String escalationLevel
    );

    boolean existsByRequestIdAndEscalationLevelAndEscalatedAtAfter(
            Long requestId,
            String escalationLevel,
            LocalDateTime since
    );
}
