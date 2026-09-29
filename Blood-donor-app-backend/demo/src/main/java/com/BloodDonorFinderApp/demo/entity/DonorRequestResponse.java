package com.BloodDonorFinderApp.demo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(
        name = "donor_request_responses",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {
                                "request_id",
                                "donor_id"
                        }
                )
        }
)
public class DonorRequestResponse {

    // ==========================================
    // ID
    // ==========================================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // ==========================================
    // BLOOD REQUEST
    // ==========================================

    @Setter
    @ManyToOne
    @JoinColumn(
            name = "request_id",
            nullable = false
    )
    private BloodRequest bloodRequest;


    // ==========================================
    // DONOR
    // ==========================================

    @Setter
    @ManyToOne
    @JoinColumn(
            name = "donor_id",
            nullable = false
    )
    private DonorProfile donor;


    // ==========================================
    // RESPONSE STATUS
    //
    // PENDING
    // ACCEPTED
    // DECLINED
    // ==========================================

    @Column(nullable = false)
    private String response = "PENDING";


    // ==========================================
    // SMART MATCHING DATA
    // ==========================================

    private Double matchScore;

    private Double distance;


    // ==========================================
    // RECOMMENDATION TIME
    // ==========================================

    @Column(nullable = false)
    private LocalDateTime recommendedAt;


    // ==========================================
    // RESPONSE TIME
    // ==========================================

    private LocalDateTime respondedAt;


    // ==========================================
    // AUTO SET RECOMMENDATION TIME
    // ==========================================

    @PrePersist
    protected void onCreate() {

        if (recommendedAt == null) {
            recommendedAt = LocalDateTime.now();
        }

    }


    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    public DonorRequestResponse() {
    }


    // ==========================================
    // ID
    // ==========================================

    public void setId(Long id) {
        this.id = id;
    }


    // ==========================================
    // BLOOD REQUEST
    // ==========================================


    // ==========================================
    // DONOR
    // ==========================================


    // ==========================================
    // RESPONSE
    // ==========================================

    public void setResponse(
            String response
    ) {
        this.response = response;

        // Set response time when donor responds
        if (
                ("ACCEPTED".equalsIgnoreCase(response)
                        || "DECLINED".equalsIgnoreCase(response))
                        && respondedAt == null
        ) {

            respondedAt = LocalDateTime.now();

        }
    }


    // ==========================================
    // MATCH SCORE
    // ==========================================

    public void setMatchScore(
            Double matchScore
    ) {
        this.matchScore = matchScore;
    }


    // ==========================================
    // DISTANCE
    // ==========================================

    public void setDistance(
            Double distance
    ) {
        this.distance = distance;
    }


    // ==========================================
    // RECOMMENDED AT
    // ==========================================

    public void setRecommendedAt(
            LocalDateTime recommendedAt
    ) {
        this.recommendedAt = recommendedAt;
    }


    // ==========================================
    // RESPONDED AT
    // ==========================================

    public void setRespondedAt(
            LocalDateTime respondedAt
    ) {
        this.respondedAt = respondedAt;
    }
}