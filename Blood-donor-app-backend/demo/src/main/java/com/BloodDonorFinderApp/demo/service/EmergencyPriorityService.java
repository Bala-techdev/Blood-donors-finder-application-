package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.dto.EmergencyPriorityResult;
import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
public class EmergencyPriorityService {

    private final BloodRequestRepository bloodRequestRepository;

    public EmergencyPriorityService(
            BloodRequestRepository bloodRequestRepository
    ) {
        this.bloodRequestRepository = bloodRequestRepository;
    }

    public EmergencyPriorityResult calculatePriority(Long requestId) {

        BloodRequest request = bloodRequestRepository
                .findById(requestId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Blood request not found with ID: " + requestId
                        )
                );

        double score = 0;

        StringBuilder reasons = new StringBuilder();

        // ==========================================
        // 1. URGENCY
        // Maximum = 60 points
        // ==========================================

        String urgency = request.getUrgency();

        if (urgency != null) {

            switch (urgency.toUpperCase()) {

                case "EMERGENCY":
                    score += 60;
                    reasons.append("Emergency-level request. ");
                    break;

                case "URGENT":
                    score += 40;
                    reasons.append("Urgent blood requirement. ");
                    break;

                case "NORMAL":
                    score += 20;
                    reasons.append("Normal-priority blood request. ");
                    break;

                default:
                    score += 10;
                    reasons.append("Urgency level requires review. ");
            }
        }

        // ==========================================
        // 2. REQUIRED DATE
        // Maximum = 30 points
        // ==========================================

        LocalDate requiredDate = request.getRequiredDate();

        if (requiredDate != null) {

            LocalDate today = LocalDate.now();

            long daysUntilRequired =
                    ChronoUnit.DAYS.between(
                            today,
                            requiredDate
                    );

            if (daysUntilRequired <= 0) {

                score += 30;

                reasons.append(
                        "Blood is required today or immediately. "
                );

            } else if (daysUntilRequired == 1) {

                score += 25;

                reasons.append(
                        "Blood is required within 1 day. "
                );

            } else if (daysUntilRequired <= 3) {

                score += 15;

                reasons.append(
                        "Blood is required within 3 days. "
                );

            } else if (daysUntilRequired <= 7) {

                score += 8;

                reasons.append(
                        "Blood is required within 7 days. "
                );
            }
        }

        // ==========================================
        // 3. NUMBER OF UNITS
        // Maximum = 10 points
        // ==========================================

        Integer units = request.getUnits();

        if (units != null) {

            if (units >= 4) {

                score += 10;

                reasons.append(
                        "Multiple blood units are required. "
                );

            } else if (units >= 2) {

                score += 7;

                reasons.append(
                        "More than one blood unit is required. "
                );

            } else {

                score += 4;
            }
        }

        // ==========================================
        // LIMIT SCORE
        // ==========================================

        score = Math.min(score, 100);

        // ==========================================
        // DETERMINE PRIORITY LEVEL
        // ==========================================

        String priorityLevel;

        if (score >= 80) {

            priorityLevel = "CRITICAL";

        } else if (score >= 55) {

            priorityLevel = "HIGH";

        } else if (score >= 30) {

            priorityLevel = "MEDIUM";

        } else {

            priorityLevel = "LOW";
        }

        // ==========================================
        // FALLBACK REASON
        // ==========================================

        if (reasons.length() == 0) {

            reasons.append(
                    "Priority calculated from available request information."
            );
        }

        return new EmergencyPriorityResult(
                request.getId(),
                priorityLevel,
                score,
                reasons.toString().trim()
        );
    }
}