package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.dto.DonorReliabilityResult;
import com.BloodDonorFinderApp.demo.entity.DonorRequestResponse;
import com.BloodDonorFinderApp.demo.repository.DonorRequestResponseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DonorReliabilityService {

    private final DonorRequestResponseRepository responseRepository;


    public DonorReliabilityService(
            DonorRequestResponseRepository responseRepository
    ) {

        this.responseRepository =
                responseRepository;
    }


    // =========================================================
    // CALCULATE DONOR RELIABILITY
    // =========================================================

    public DonorReliabilityResult calculateReliability(
            Long donorId
    ) {

        List<DonorRequestResponse> responses =
                responseRepository.findByDonorId(
                        donorId
                );


        // =====================================================
        // COUNT HISTORY
        // =====================================================

        int totalRecommendations =
                responses.size();

        int acceptedCount = 0;

        int declinedCount = 0;

        int pendingCount = 0;


        for (
                DonorRequestResponse response
                : responses
        ) {

            String status =
                    response.getResponse();


            if (
                    "ACCEPTED".equalsIgnoreCase(status)
            ) {

                acceptedCount++;

            } else if (
                    "DECLINED".equalsIgnoreCase(status)
            ) {

                declinedCount++;

            } else {

                pendingCount++;
            }
        }


        int respondedCount =
                acceptedCount + declinedCount;


        // =====================================================
        // NEW DONOR
        // =====================================================

        if (totalRecommendations == 0) {

            return new DonorReliabilityResult(

                    donorId,

                    50.0,

                    "NEW",

                    0,

                    0,

                    0,

                    0,

                    0,

                    0.0,

                    0.0,

                    "No previous response history is available for this donor."
            );
        }


        // =====================================================
        // RESPONSE RATE
        // =====================================================

        double responseRate =
                ((double) respondedCount
                        / totalRecommendations)
                        * 100.0;


        // =====================================================
        // ACCEPTANCE RATE
        // =====================================================

        double acceptanceRate = 0;


        if (respondedCount > 0) {

            acceptanceRate =
                    ((double) acceptedCount
                            / respondedCount)
                            * 100.0;
        }


        // =====================================================
        // RELIABILITY SCORE
        // =====================================================

        /*
         * Response behaviour:
         *
         * Response Rate   = 60%
         * Acceptance Rate = 40%
         */

        double reliabilityScore =
                (responseRate * 0.60)
                        +
                        (acceptanceRate * 0.40);


        reliabilityScore =
                Math.min(
                        100.0,
                        Math.max(
                                0.0,
                                reliabilityScore
                        )
                );


        reliabilityScore =
                Math.round(
                        reliabilityScore * 10.0
                ) / 10.0;


        // =====================================================
        // RELIABILITY LEVEL
        // =====================================================

        String reliabilityLevel;


        if (reliabilityScore >= 80) {

            reliabilityLevel = "HIGH";

        } else if (reliabilityScore >= 60) {

            reliabilityLevel = "MEDIUM";

        } else {

            reliabilityLevel = "LOW";
        }


        // =====================================================
        // EXPLANATION
        // =====================================================

        String explanation;


        if (respondedCount == 0) {

            explanation =
                    "The donor has been recommended before "
                            + "but has not yet responded to any request.";

        } else {

            explanation =
                    "Based on "
                            + respondedCount
                            + " recorded response(s), the donor responded to "
                            + String.format("%.0f", responseRate)
                            + "% of recommendations and accepted "
                            + String.format("%.0f", acceptanceRate)
                            + "% of responded requests.";
        }


        // =====================================================
        // RESULT
        // =====================================================

        return new DonorReliabilityResult(

                donorId,

                reliabilityScore,

                reliabilityLevel,

                totalRecommendations,

                respondedCount,

                acceptedCount,

                declinedCount,

                pendingCount,

                round(responseRate),

                round(acceptanceRate),

                explanation
        );
    }


    // =========================================================
    // ROUND VALUE
    // =========================================================

    private double round(double value) {

        return Math.round(
                value * 10.0
        ) / 10.0;
    }
}