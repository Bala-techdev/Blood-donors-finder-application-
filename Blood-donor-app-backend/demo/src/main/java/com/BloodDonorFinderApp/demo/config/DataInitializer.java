package com.BloodDonorFinderApp.demo.config;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import com.BloodDonorFinderApp.demo.repository.DonorProfileRepository;
import com.BloodDonorFinderApp.demo.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log =
            LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final DonorProfileRepository donorProfileRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            UserRepository userRepository,
            DonorProfileRepository donorProfileRepository,
            BloodRequestRepository bloodRequestRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.donorProfileRepository = donorProfileRepository;
        this.bloodRequestRepository = bloodRequestRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded — skipping demo data initialization.");
            return;
        }

        log.info("Empty database detected — seeding demo data...");

        // ─── Demo User 1: Recipient ───────────────────────────────
        User recipient = new User(
                "Priya Sharma",
                "priya@demo.com",
                passwordEncoder.encode("Demo@1234"),
                "+91-9876543210",
                "USER"
        );
        recipient = userRepository.save(recipient);
        log.info("Created demo recipient: {} (id={})", recipient.getEmail(), recipient.getId());

        // ─── Demo User 2: Eligible Donor ──────────────────────────
        User donor = new User(
                "Rahul Verma",
                "rahul@demo.com",
                passwordEncoder.encode("Demo@1234"),
                "+91-9123456789",
                "DONOR"
        );
        donor = userRepository.save(donor);
        log.info("Created demo donor: {} (id={})", donor.getEmail(), donor.getId());

        // ─── Demo User 3: Emergency Coordinator ───────────────────
        User coordinator = new User(
                "Dr. Ananya Patel",
                "ananya@demo.com",
                passwordEncoder.encode("Demo@1234"),
                "+91-9988776655",
                "COORDINATOR"
        );
        coordinator = userRepository.save(coordinator);
        log.info("Created demo coordinator: {} (id={})", coordinator.getEmail(), coordinator.getId());

        // ─── Donor Profile for Rahul ──────────────────────────────
        if (donorProfileRepository.count() == 0) {
            DonorProfile donorProfile = new DonorProfile();
            donorProfile.setUser(donor);
            donorProfile.setBloodGroup("O+");
            donorProfile.setGender("Male");
            donorProfile.setDateOfBirth(LocalDate.of(1995, 3, 15));
            donorProfile.setLocation("Bengaluru, Karnataka");
            donorProfile.setLatitude(12.9716);
            donorProfile.setLongitude(77.5946);
            donorProfile.setAvailable(true);
            donorProfile.setLastDonationDate(LocalDate.now().minusMonths(4));
            donorProfile.setVerified(true);
            donorProfile.setTotalDonations(5);
            donorProfileRepository.save(donorProfile);
            log.info("Created donor profile for {} (blood group: {})",
                    donor.getName(), donorProfile.getBloodGroup());
        }

        // ─── Sample Blood Request 1: Urgent ──────────────────────
        BloodRequest urgentRequest = new BloodRequest();
        urgentRequest.setRequester(recipient);
        urgentRequest.setPatientName("Amit Kumar");
        urgentRequest.setBloodGroup("O+");
        urgentRequest.setUnits(2);
        urgentRequest.setHospitalName("Apollo Hospital");
        urgentRequest.setLocation("Bengaluru, Karnataka");
        urgentRequest.setLatitude(12.9352);
        urgentRequest.setLongitude(77.6245);
        urgentRequest.setUrgency("URGENT");
        urgentRequest.setRequiredDate(LocalDate.now().plusDays(1));
        urgentRequest.setStatus("PENDING");
        urgentRequest.setDescription(
                "Post-surgery blood requirement. Patient needs O+ blood urgently."
        );
        bloodRequestRepository.save(urgentRequest);
        log.info("Created urgent blood request for patient: {}", urgentRequest.getPatientName());

        // ─── Sample Blood Request 2: Normal ──────────────────────
        BloodRequest normalRequest = new BloodRequest();
        normalRequest.setRequester(coordinator);
        normalRequest.setPatientName("Sneha Reddy");
        normalRequest.setBloodGroup("A-");
        normalRequest.setUnits(1);
        normalRequest.setHospitalName("Manipal Hospital");
        normalRequest.setLocation("Bengaluru, Karnataka");
        normalRequest.setLatitude(12.9634);
        normalRequest.setLongitude(77.5855);
        normalRequest.setUrgency("NORMAL");
        normalRequest.setRequiredDate(LocalDate.now().plusDays(5));
        normalRequest.setStatus("PENDING");
        normalRequest.setDescription(
                "Scheduled transfusion for thalassemia patient. A- preferred."
        );
        bloodRequestRepository.save(normalRequest);
        log.info("Created normal blood request for patient: {}", normalRequest.getPatientName());

        log.info("Demo data initialization complete — 3 users, 1 donor profile, 2 blood requests.");
    }
}

