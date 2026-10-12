package com.BloodDonorFinderApp.demo.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "emergency_escalation_events",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_escalation_request_level",
                columnNames = {"request_id", "escalation_level"}
        )
)
public class EmergencyEscalationEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", nullable = false)
    private Long requestId;

    @Column(name = "escalation_level", nullable = false, length = 32)
    private String escalationLevel;

    @Column(nullable = false)
    private LocalDateTime escalatedAt;

    @Column(nullable = false)
    private int recommendationCount;

    protected EmergencyEscalationEvent() {
    }

    public EmergencyEscalationEvent(
            Long requestId,
            String escalationLevel,
            int recommendationCount
    ) {
        this.requestId = requestId;
        this.escalationLevel = escalationLevel;
        this.recommendationCount = recommendationCount;
        this.escalatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getRequestId() {
        return requestId;
    }

    public String getEscalationLevel() {
        return escalationLevel;
    }

    public LocalDateTime getEscalatedAt() {
        return escalatedAt;
    }

    public int getRecommendationCount() {
        return recommendationCount;
    }
}
