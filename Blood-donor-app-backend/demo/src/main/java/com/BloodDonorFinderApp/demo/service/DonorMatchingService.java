package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import com.BloodDonorFinderApp.demo.repository.DonorProfileRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class DonorMatchingService {

    private final DonorProfileRepository donorProfileRepository;

    private final DonationEligibilityService
            donationEligibilityService;

    public DonorMatchingService(
            DonorProfileRepository donorProfileRepository,
            DonationEligibilityService donationEligibilityService
    ) {

        this.donorProfileRepository =
                donorProfileRepository;

        this.donationEligibilityService =
                donationEligibilityService;
    }


    // =========================================================
    // FIND BEST DONORS
    // =========================================================

    public List<DonorMatchResult> findBestDonors(
            BloodRequest request
    ) {

        List<DonorProfile> donors =
                donorProfileRepository.findAll();

        List<DonorMatchResult> matches =
                new ArrayList<>();


        for (DonorProfile donor : donors) {

            // -----------------------------------------------
            // 1. AVAILABILITY
            // -----------------------------------------------

            if (!donor.isAvailable()) {
                continue;
            }


            // -----------------------------------------------
            // 2. BLOOD COMPATIBILITY
            // -----------------------------------------------

            if (!isCompatible(
                    request.getBloodGroup(),
                    donor.getBloodGroup()
            )) {
                continue;
            }


            // -----------------------------------------------
            // 3. DONATION ELIGIBILITY
            // -----------------------------------------------

            boolean eligible =
                    donationEligibilityService
                            .isEligible(donor);

            if (!eligible) {
                continue;
            }


            // -----------------------------------------------
            // 4. DISTANCE
            // -----------------------------------------------

            double distance =
                    calculateDistance(
                            request,
                            donor
                    );


            // -----------------------------------------------
            // 5. DAYS SINCE LAST DONATION
            // -----------------------------------------------

            long daysSinceLastDonation =
                    donationEligibilityService
                            .getDaysSinceLastDonation(donor);


            // -----------------------------------------------
            // 6. CALCULATE EXPLAINABLE SCORE
            // -----------------------------------------------

            MatchScoreBreakdown breakdown =
                    calculateScoreBreakdown(
                            request,
                            donor,
                            distance,
                            eligible
                    );


            // -----------------------------------------------
            // 7. ADD RESULT
            // -----------------------------------------------

            matches.add(

                    new DonorMatchResult(
                            donor,
                            breakdown.getTotalScore(),
                            distance,
                            eligible,
                            daysSinceLastDonation,
                            breakdown
                    )
            );
        }


        // -----------------------------------------------
        // HIGHEST SCORE FIRST
        // -----------------------------------------------

        matches.sort(
                Comparator.comparingDouble(
                        DonorMatchResult::getScore
                ).reversed()
        );


        return matches;
    }


    // =========================================================
    // BLOOD COMPATIBILITY
    // =========================================================

    private boolean isCompatible(
            String recipientGroup,
            String donorGroup
    ) {

        if (recipientGroup == null ||
                donorGroup == null) {

            return false;
        }


        recipientGroup =
                recipientGroup.trim().toUpperCase();

        donorGroup =
                donorGroup.trim().toUpperCase();


        if (recipientGroup.equals(donorGroup)) {
            return true;
        }


        switch (recipientGroup) {

            case "O-":
                return donorGroup.equals("O-");

            case "O+":
                return donorGroup.equals("O+")
                        || donorGroup.equals("O-");

            case "A-":
                return donorGroup.equals("A-")
                        || donorGroup.equals("O-");

            case "A+":
                return donorGroup.equals("A+")
                        || donorGroup.equals("A-")
                        || donorGroup.equals("O+")
                        || donorGroup.equals("O-");

            case "B-":
                return donorGroup.equals("B-")
                        || donorGroup.equals("O-");

            case "B+":
                return donorGroup.equals("B+")
                        || donorGroup.equals("B-")
                        || donorGroup.equals("O+")
                        || donorGroup.equals("O-");

            case "AB-":
                return donorGroup.equals("AB-")
                        || donorGroup.equals("A-")
                        || donorGroup.equals("B-")
                        || donorGroup.equals("O-");

            case "AB+":
                return donorGroup.equals("AB+")
                        || donorGroup.equals("AB-")
                        || donorGroup.equals("A+")
                        || donorGroup.equals("A-")
                        || donorGroup.equals("B+")
                        || donorGroup.equals("B-")
                        || donorGroup.equals("O+")
                        || donorGroup.equals("O-");

            default:
                return false;
        }
    }


    // =========================================================
    // EXPLAINABLE SCORE BREAKDOWN
    // =========================================================

    private MatchScoreBreakdown calculateScoreBreakdown(
            BloodRequest request,
            DonorProfile donor,
            double distance,
            boolean eligible
    ) {

        double compatibilityScore = 0;
        double availabilityScore = 0;
        double verificationScore = 0;
        double experienceScore = 0;
        double distanceScore = 0;
        double eligibilityScore = 0;


        // -----------------------------------------------
        // BLOOD COMPATIBILITY - MAX 40
        // -----------------------------------------------

        if (request.getBloodGroup()
                .equalsIgnoreCase(
                        donor.getBloodGroup()
                )) {

            compatibilityScore = 40;

        } else {

            compatibilityScore = 25;
        }


        // -----------------------------------------------
        // AVAILABILITY - MAX 10
        // -----------------------------------------------

        if (donor.isAvailable()) {

            availabilityScore = 10;
        }


        // -----------------------------------------------
        // VERIFICATION - MAX 10
        // -----------------------------------------------

        if (donor.isVerified()) {

            verificationScore = 10;
        }


        // -----------------------------------------------
        // DONATION EXPERIENCE - MAX 10
        // -----------------------------------------------

        if (donor.getTotalDonations() != null) {

            if (donor.getTotalDonations() >= 5) {

                experienceScore = 10;

            } else if (
                    donor.getTotalDonations() >= 2
            ) {

                experienceScore = 7;

            } else {

                experienceScore = 4;
            }
        }


        // -----------------------------------------------
        // DISTANCE - MAX 15
        // -----------------------------------------------

        if (distance <= 5) {

            distanceScore = 15;

        } else if (distance <= 10) {

            distanceScore = 12;

        } else if (distance <= 25) {

            distanceScore = 9;

        } else if (distance <= 50) {

            distanceScore = 6;

        } else {

            distanceScore = 3;
        }


        // -----------------------------------------------
        // ELIGIBILITY - MAX 15
        // -----------------------------------------------

        if (eligible) {

            eligibilityScore = 15;
        }


        double totalScore =
                compatibilityScore
                        + availabilityScore
                        + verificationScore
                        + experienceScore
                        + distanceScore
                        + eligibilityScore;


        totalScore =
                Math.min(totalScore, 100);


        return new MatchScoreBreakdown(
                compatibilityScore,
                availabilityScore,
                verificationScore,
                experienceScore,
                distanceScore,
                eligibilityScore,
                totalScore
        );
    }


    // =========================================================
    // HAVERSINE DISTANCE
    // =========================================================

    private double calculateDistance(
            BloodRequest request,
            DonorProfile donor
    ) {

        if (request.getLatitude() == null ||
                request.getLongitude() == null ||
                donor.getLatitude() == null ||
                donor.getLongitude() == null) {

            return 999.0;
        }


        final double EARTH_RADIUS = 6371.0;


        double requestLatitude =
                Math.toRadians(
                        request.getLatitude()
                );

        double requestLongitude =
                Math.toRadians(
                        request.getLongitude()
                );


        double donorLatitude =
                Math.toRadians(
                        donor.getLatitude()
                );

        double donorLongitude =
                Math.toRadians(
                        donor.getLongitude()
                );


        double latitudeDifference =
                donorLatitude - requestLatitude;

        double longitudeDifference =
                donorLongitude - requestLongitude;


        double a =
                Math.sin(latitudeDifference / 2)
                        * Math.sin(latitudeDifference / 2)

                        +

                        Math.cos(requestLatitude)
                                * Math.cos(donorLatitude)

                                *

                                Math.sin(longitudeDifference / 2)
                                * Math.sin(longitudeDifference / 2);


        double c =
                2 * Math.atan2(
                        Math.sqrt(a),
                        Math.sqrt(1 - a)
                );


        double distance =
                EARTH_RADIUS * c;


        return Math.round(
                distance * 100.0
        ) / 100.0;
    }


    // =========================================================
    // MATCH SCORE BREAKDOWN
    // =========================================================

    public static class MatchScoreBreakdown {

        private double compatibilityScore;
        private double availabilityScore;
        private double verificationScore;
        private double experienceScore;
        private double distanceScore;
        private double eligibilityScore;
        private double totalScore;


        public MatchScoreBreakdown() {
        }


        public MatchScoreBreakdown(
                double compatibilityScore,
                double availabilityScore,
                double verificationScore,
                double experienceScore,
                double distanceScore,
                double eligibilityScore,
                double totalScore
        ) {

            this.compatibilityScore =
                    compatibilityScore;

            this.availabilityScore =
                    availabilityScore;

            this.verificationScore =
                    verificationScore;

            this.experienceScore =
                    experienceScore;

            this.distanceScore =
                    distanceScore;

            this.eligibilityScore =
                    eligibilityScore;

            this.totalScore =
                    totalScore;
        }


        public double getCompatibilityScore() {
            return compatibilityScore;
        }

        public void setCompatibilityScore(
                double compatibilityScore
        ) {
            this.compatibilityScore =
                    compatibilityScore;
        }


        public double getAvailabilityScore() {
            return availabilityScore;
        }

        public void setAvailabilityScore(
                double availabilityScore
        ) {
            this.availabilityScore =
                    availabilityScore;
        }


        public double getVerificationScore() {
            return verificationScore;
        }

        public void setVerificationScore(
                double verificationScore
        ) {
            this.verificationScore =
                    verificationScore;
        }


        public double getExperienceScore() {
            return experienceScore;
        }

        public void setExperienceScore(
                double experienceScore
        ) {
            this.experienceScore =
                    experienceScore;
        }


        public double getDistanceScore() {
            return distanceScore;
        }

        public void setDistanceScore(
                double distanceScore
        ) {
            this.distanceScore =
                    distanceScore;
        }


        public double getEligibilityScore() {
            return eligibilityScore;
        }

        public void setEligibilityScore(
                double eligibilityScore
        ) {
            this.eligibilityScore =
                    eligibilityScore;
        }


        public double getTotalScore() {
            return totalScore;
        }

        public void setTotalScore(
                double totalScore
        ) {
            this.totalScore =
                    totalScore;
        }
    }


    // =========================================================
    // MATCH RESULT
    // =========================================================

    public static class DonorMatchResult {

        private DonorProfile donor;

        private double score;

        private double distance;

        private boolean eligible;

        private long daysSinceLastDonation;

        private MatchScoreBreakdown scoreBreakdown;


        public DonorMatchResult() {
        }


        public DonorMatchResult(
                DonorProfile donor,
                double score,
                double distance,
                boolean eligible,
                long daysSinceLastDonation,
                MatchScoreBreakdown scoreBreakdown
        ) {

            this.donor = donor;

            this.score = score;

            this.distance = distance;

            this.eligible = eligible;

            this.daysSinceLastDonation =
                    daysSinceLastDonation;

            this.scoreBreakdown =
                    scoreBreakdown;
        }


        public DonorProfile getDonor() {
            return donor;
        }


        public void setDonor(
                DonorProfile donor
        ) {
            this.donor = donor;
        }


        public double getScore() {
            return score;
        }


        public void setScore(
                double score
        ) {
            this.score = score;
        }


        public double getDistance() {
            return distance;
        }


        public void setDistance(
                double distance
        ) {
            this.distance = distance;
        }


        public boolean isEligible() {
            return eligible;
        }


        public void setEligible(
                boolean eligible
        ) {
            this.eligible = eligible;
        }


        public long getDaysSinceLastDonation() {
            return daysSinceLastDonation;
        }


        public void setDaysSinceLastDonation(
                long daysSinceLastDonation
        ) {
            this.daysSinceLastDonation =
                    daysSinceLastDonation;
        }


        public MatchScoreBreakdown getScoreBreakdown() {
            return scoreBreakdown;
        }


        public void setScoreBreakdown(
                MatchScoreBreakdown scoreBreakdown
        ) {
            this.scoreBreakdown =
                    scoreBreakdown;
        }
    }
}