package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
public class DonationEligibilityService {

    private static final long MINIMUM_DONATION_INTERVAL = 90;


    public boolean isEligible(DonorProfile donor) {

        // Donor must be available
        if (!donor.isAvailable()) {
            return false;
        }


        LocalDate lastDonationDate =
                donor.getLastDonationDate();


        // If donor has never donated before,
        // consider eligible for this prototype
        if (lastDonationDate == null) {
            return true;
        }


        long daysSinceLastDonation =
                ChronoUnit.DAYS.between(
                        lastDonationDate,
                        LocalDate.now()
                );


        return daysSinceLastDonation
                >= MINIMUM_DONATION_INTERVAL;
    }


    public long getDaysSinceLastDonation(
            DonorProfile donor
    ) {

        LocalDate lastDonationDate =
                donor.getLastDonationDate();


        // No previous donation
        if (lastDonationDate == null) {
            return -1;
        }


        return ChronoUnit.DAYS.between(
                lastDonationDate,
                LocalDate.now()
        );
    }


    public long getRemainingDays(
            DonorProfile donor
    ) {

        long daysSinceDonation =
                getDaysSinceLastDonation(donor);


        if (daysSinceDonation == -1) {
            return 0;
        }


        long remainingDays =
                MINIMUM_DONATION_INTERVAL
                        - daysSinceDonation;


        return Math.max(remainingDays, 0);
    }
}