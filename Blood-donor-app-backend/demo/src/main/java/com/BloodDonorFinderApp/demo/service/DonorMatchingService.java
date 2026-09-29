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


            // -------------------------------------------------
            // 1. CHECK AVAILABILITY
            // -------------------------------------------------

            if (!donor.isAvailable()) {
                continue;
            }


            // -------------------------------------------------
            // 2. CHECK BLOOD COMPATIBILITY
            // -------------------------------------------------

            if (!isCompatible(
                    request.getBloodGroup(),
                    donor.getBloodGroup()
            )) {

                continue;
            }


            // -------------------------------------------------
            // 3. CHECK DONATION ELIGIBILITY
            // -------------------------------------------------

            boolean eligible =
                    donationEligibilityService
                            .isEligible(donor);


            // Recently donated donors are not recommended

            if (!eligible) {
                continue;
            }


            // -------------------------------------------------
            // 4. CALCULATE DISTANCE
            // -------------------------------------------------

            double distance =
                    calculateDistance(
                            request,
                            donor
                    );


            // -------------------------------------------------
            // 5. CALCULATE DAYS SINCE LAST DONATION
            // -------------------------------------------------

            long daysSinceLastDonation =
                    donationEligibilityService
                            .getDaysSinceLastDonation(donor);


            // -------------------------------------------------
            // 6. CALCULATE MATCH SCORE
            // -------------------------------------------------

            double score =
                    calculateScore(
                            request,
                            donor,
                            distance,
                            eligible
                    );


            // -------------------------------------------------
            // 7. ADD MATCH RESULT
            // -------------------------------------------------

            matches.add(

                    new DonorMatchResult(
                            donor,
                            score,
                            distance,
                            eligible,
                            daysSinceLastDonation
                    )
            );
        }


        // -----------------------------------------------------
        // HIGHEST SCORE FIRST
        // -----------------------------------------------------

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


        // Exact blood group match

        if (recipientGroup.equals(donorGroup)) {
            return true;
        }


        /*
         * Blood compatibility for red blood cell donation.
         *
         * Recipient -> Compatible Donor Groups
         *
         * O-  -> O-
         * O+  -> O+, O-
         * A-  -> A-, O-
         * A+  -> A+, A-, O+, O-
         * B-  -> B-, O-
         * B+  -> B+, B-, O+, O-
         * AB- -> AB-, A-, B-, O-
         * AB+ -> AB+, AB-, A+, A-, B+, B-, O+, O-
         */


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
    // INTELLIGENT MATCH SCORE
    // =========================================================

    private double calculateScore(
            BloodRequest request,
            DonorProfile donor,
            double distance,
            boolean eligible
    ) {

        double score = 0;


        // -----------------------------------------------------
        // 1. BLOOD GROUP COMPATIBILITY
        // Maximum = 40
        // -----------------------------------------------------

        if (request.getBloodGroup()
                .equalsIgnoreCase(
                        donor.getBloodGroup()
                )) {

            // Exact blood group match

            score += 40;

        } else {

            // Compatible blood group

            score += 25;
        }


        // -----------------------------------------------------
        // 2. AVAILABILITY
        // Maximum = 10
        // -----------------------------------------------------

        if (donor.isAvailable()) {

            score += 10;
        }


        // -----------------------------------------------------
        // 3. VERIFICATION
        // Maximum = 10
        // -----------------------------------------------------

        if (donor.isVerified()) {

            score += 10;
        }


        // -----------------------------------------------------
        // 4. DONATION EXPERIENCE
        // Maximum = 10
        // -----------------------------------------------------

        if (donor.getTotalDonations() != null) {


            if (donor.getTotalDonations() >= 5) {

                score += 10;

            } else if (
                    donor.getTotalDonations() >= 2
            ) {

                score += 7;

            } else {

                score += 4;
            }
        }


        // -----------------------------------------------------
        // 5. LOCATION / DISTANCE
        // Maximum = 15
        // -----------------------------------------------------

        if (distance <= 5) {

            score += 15;

        } else if (distance <= 10) {

            score += 12;

        } else if (distance <= 25) {

            score += 9;

        } else if (distance <= 50) {

            score += 6;

        } else {

            score += 3;
        }


        // -----------------------------------------------------
        // 6. DONATION ELIGIBILITY
        // Maximum = 15
        // -----------------------------------------------------

        if (eligible) {

            score += 15;
        }


        // -----------------------------------------------------
        // MAXIMUM SCORE = 100
        // -----------------------------------------------------

        return Math.min(score, 100);
    }


    // =========================================================
    // HAVERSINE DISTANCE CALCULATION
    // =========================================================

    private double calculateDistance(
            BloodRequest request,
            DonorProfile donor
    ) {


        /*
         * If coordinates are unavailable,
         * return a large distance.
         */

        if (request.getLatitude() == null ||
                request.getLongitude() == null ||
                donor.getLatitude() == null ||
                donor.getLongitude() == null) {

            return 999.0;
        }


        // Earth's radius in kilometres

        final double EARTH_RADIUS = 6371.0;


        // Request coordinates

        double requestLatitude =
                Math.toRadians(
                        request.getLatitude()
                );

        double requestLongitude =
                Math.toRadians(
                        request.getLongitude()
                );


        // Donor coordinates

        double donorLatitude =
                Math.toRadians(
                        donor.getLatitude()
                );

        double donorLongitude =
                Math.toRadians(
                        donor.getLongitude()
                );


        // Difference between coordinates

        double latitudeDifference =
                donorLatitude - requestLatitude;

        double longitudeDifference =
                donorLongitude - requestLongitude;


        // Haversine formula

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


        // Round to 2 decimal places

        return Math.round(
                distance * 100.0
        ) / 100.0;
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


        public DonorMatchResult() {
        }


        public DonorMatchResult(
                DonorProfile donor,
                double score,
                double distance,
                boolean eligible,
                long daysSinceLastDonation
        ) {

            this.donor = donor;

            this.score = score;

            this.distance = distance;

            this.eligible = eligible;

            this.daysSinceLastDonation =
                    daysSinceLastDonation;
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
    }
}