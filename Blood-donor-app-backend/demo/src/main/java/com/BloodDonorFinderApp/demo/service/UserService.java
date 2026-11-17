package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Registration
    public User createUser(User user) {

        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }

        // Normalise email (trim whitespace + lowercase with Locale.ROOT)
        String normalisedEmail = user.getEmail().trim().toLowerCase(Locale.ROOT);
        user.setEmail(normalisedEmail);

        if (userRepository.existsByEmailIgnoreCase(normalisedEmail)
                || userRepository.existsByEmail(normalisedEmail)) {
            throw new RuntimeException("Email already registered");
        }

        user.setPassword(
                passwordEncoder.encode(user.getPassword())
        );

        return userRepository.save(user);
    }

    // Find user by email (case-insensitive)
    public Optional<User> getUserByEmail(String email) {
        if (email == null) {
            return Optional.empty();
        }
        String normalisedEmail = email.trim().toLowerCase(Locale.ROOT);
        return userRepository.findByEmailIgnoreCase(normalisedEmail);
    }

    // Update authenticated user
    public User updateUserByEmail(
            String email,
            User updatedUser
    ) {

        String normalisedEmail = email != null ? email.trim().toLowerCase(Locale.ROOT) : "";

        User existingUser = userRepository
                .findByEmailIgnoreCase(normalisedEmail)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        existingUser.setName(updatedUser.getName());
        existingUser.setPhone(updatedUser.getPhone());

        /*
         * Do NOT allow the client to change:
         *
         * - id
         * - password
         * - role
         *
         * through this endpoint.
         */

        return userRepository.save(existingUser);
    }
}