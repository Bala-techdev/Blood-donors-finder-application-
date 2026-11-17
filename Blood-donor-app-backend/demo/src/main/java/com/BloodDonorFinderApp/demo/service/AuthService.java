package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.dto.LoginRequest;
import com.BloodDonorFinderApp.demo.dto.LoginResponse;
import com.BloodDonorFinderApp.demo.entity.RefreshToken;
import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.repository.RefreshTokenRepository;
import com.BloodDonorFinderApp.demo.repository.UserRepository;
import com.BloodDonorFinderApp.demo.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${mail.enabled:false}")
    private boolean mailEnabled;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {

        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            log.warn("Login failed: empty or null email submitted");
            throw new RuntimeException("Invalid email or password");
        }

        /*
         * Email Normalisation:
         * We trim leading/trailing whitespace and convert the input to lowercase
         * using Locale.ROOT. Combined with UserRepository.findByEmailIgnoreCase,
         * this eliminates login mismatches caused by mobile auto-capitalisation,
         * accidental trailing whitespace, or case-sensitive database collations.
         */
        String normalisedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);

        User user = userRepository
                .findByEmailIgnoreCase(normalisedEmail)
                .orElseThrow(() -> {
                    log.warn("Login failed: user not found for email: {}", normalisedEmail);
                    return new RuntimeException("Invalid email or password");
                });

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        )) {
            log.warn("Login failed: password mismatch for email: {}", normalisedEmail);
            throw new RuntimeException("Invalid email or password");
        }

        String accessToken = jwtService.generateToken(user);
        RefreshToken refreshToken = createRefreshToken(user);

        return new LoginResponse(
                accessToken,
                refreshToken.getToken(),
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.isEmailVerified()
        );
    }

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        // Revoke older active tokens if necessary or append new session
        String tokenString = UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");
        Instant expiresAt = Instant.now().plus(7, ChronoUnit.DAYS);

        RefreshToken refreshToken = new RefreshToken(tokenString, user, expiresAt);
        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public LoginResponse refreshAccessToken(String tokenValue) {
        if (tokenValue == null || tokenValue.trim().isEmpty()) {
            throw new RuntimeException("Refresh token is missing");
        }

        RefreshToken refreshToken = refreshTokenRepository.findByToken(tokenValue.trim())
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        if (refreshToken.isRevoked()) {
            throw new RuntimeException("Refresh token has been revoked");
        }

        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
            throw new RuntimeException("Refresh token has expired. Please log in again.");
        }

        User user = refreshToken.getUser();
        String newAccessToken = jwtService.generateToken(user);

        return new LoginResponse(
                newAccessToken,
                refreshToken.getToken(),
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.isEmailVerified()
        );
    }

    @Transactional
    public void revokeRefreshToken(String tokenValue) {
        if (tokenValue != null && !tokenValue.trim().isEmpty()) {
            refreshTokenRepository.findByToken(tokenValue.trim()).ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
            });
        }
    }

    public boolean isMailEnabled() {
        return mailEnabled;
    }

    @Transactional
    public String sendVerificationOtp(String email) {
        String normalisedEmail = email != null ? email.trim().toLowerCase(Locale.ROOT) : "";
        User user = userRepository.findByEmailIgnoreCase(normalisedEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + normalisedEmail));

        // Generate 6-digit cryptographic OTP
        SecureRandom random = new SecureRandom();
        int code = 100000 + random.nextInt(900000);
        String otp = String.valueOf(code);

        user.setVerificationOtp(otp);
        user.setOtpExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
        userRepository.save(user);

        if (mailEnabled) {
            // In a production setup with SMTP configured:
            log.info("Sending verification email with OTP to {}", normalisedEmail);
        } else {
            // Prototype fallback: print clearly to application logs
            log.warn("[EMAIL VERIFICATION OTP] Simulation: OTP for {} is {} (valid for 10 minutes)", normalisedEmail, otp);
            System.out.println("====================================================");
            System.out.println("[SMARTBLOOD VERIFICATION OTP] For: " + normalisedEmail + " -> OTP: " + otp);
            System.out.println("====================================================");
        }

        return otp;
    }

    @Transactional
    public boolean verifyOtp(String email, String otp) {
        String normalisedEmail = email != null ? email.trim().toLowerCase(Locale.ROOT) : "";
        User user = userRepository.findByEmailIgnoreCase(normalisedEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + normalisedEmail));

        if (user.getVerificationOtp() == null || user.getOtpExpiresAt() == null) {
            throw new RuntimeException("No pending verification request found");
        }

        if (user.getOtpExpiresAt().isBefore(Instant.now())) {
            throw new RuntimeException("Verification code has expired. Please request a new one.");
        }

        if (!user.getVerificationOtp().equals(otp.trim())) {
            throw new RuntimeException("Invalid verification code");
        }

        user.setEmailVerified(true);
        user.setVerificationOtp(null);
        user.setOtpExpiresAt(null);
        userRepository.save(user);

        log.info("User {} successfully verified email address.", email);
        return true;
    }
}
