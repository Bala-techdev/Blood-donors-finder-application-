package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.DonorProfile;
import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.repository.DonorProfileRepository;
import com.BloodDonorFinderApp.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DonorServiceTest {

    private DonorProfileRepository donorProfileRepository;
    private UserRepository userRepository;
    private DonorService service;

    @BeforeEach
    void setUp() {
        donorProfileRepository = mock(DonorProfileRepository.class);
        userRepository = mock(UserRepository.class);
        service = new DonorService(donorProfileRepository, userRepository);
    }

    @Test
    void createDonor_rejectsDuplicateProfile() {
        User user = user("owner@example.com");
        DonorProfile existing = new DonorProfile();

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(donorProfileRepository.findByUserId(user.getId()))
                .thenReturn(Optional.of(existing));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.createDonor(profile("o+"), user.getEmail())
        );

        assertEquals(409, exception.getStatusCode().value());
        verify(donorProfileRepository, never()).save(any());
    }

    @Test
    void createDonor_normalizesInputAndResetsClientManagedHistory() {
        User user = user("owner@example.com");
        DonorProfile profile = profile(" o+ ");
        profile.setVerified(true);
        profile.setTotalDonations(99);
        profile.setLastDonationDate(LocalDate.now());

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(donorProfileRepository.findByUserId(user.getId()))
                .thenReturn(Optional.empty());
        when(donorProfileRepository.save(profile)).thenReturn(profile);

        DonorProfile saved = service.createDonor(profile, user.getEmail());

        assertSame(user, saved.getUser());
        assertEquals("O+", saved.getBloodGroup());
        assertEquals("Nairobi", saved.getLocation());
        assertFalse(saved.isVerified());
        assertEquals(0, saved.getTotalDonations());
        assertNull(saved.getLastDonationDate());
    }

    @Test
    void updateDonorProfile_changesOnlyOwnerProfileAndAvailability() {
        User user = user("owner@example.com");
        DonorProfile existing = profile("A+");
        existing.setUser(user);
        existing.setVerified(true);
        existing.setTotalDonations(50);
        DonorProfile update = new DonorProfile();
        update.setBloodGroup(" b- ");
        update.setLocation("  Mombasa  ");
        update.setAvailable(false);
        update.setVerified(false);
        update.setTotalDonations(0);

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(donorProfileRepository.findByUserId(user.getId()))
                .thenReturn(Optional.of(existing));
        when(donorProfileRepository.save(existing)).thenReturn(existing);

        DonorProfile saved = service.updateDonorProfile(
                user.getEmail(),
                update
        );

        assertEquals("B-", saved.getBloodGroup());
        assertEquals("Mombasa", saved.getLocation());
        assertFalse(saved.isAvailable());
        assertTrue(saved.isVerified());
        assertEquals(50, saved.getTotalDonations());
        assertSame(user, saved.getUser());
    }

    @Test
    void createDonor_rejectsInvalidCoordinates() {
        User user = user("owner@example.com");
        DonorProfile profile = profile("A+");
        profile.setLatitude(91.0);
        profile.setLongitude(36.0);

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(donorProfileRepository.findByUserId(user.getId()))
                .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.createDonor(profile, user.getEmail())
        );

        assertEquals(400, exception.getStatusCode().value());
        verify(donorProfileRepository, never()).save(any());
    }

    private User user(String email) {
        User user = new User();
        user.setId(1L);
        user.setEmail(email);
        return user;
    }

    private DonorProfile profile(String bloodGroup) {
        DonorProfile profile = new DonorProfile();
        profile.setBloodGroup(bloodGroup);
        profile.setLocation("Nairobi");
        return profile;
    }
}
