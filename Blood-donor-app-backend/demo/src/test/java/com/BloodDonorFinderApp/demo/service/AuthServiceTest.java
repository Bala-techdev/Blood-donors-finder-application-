package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.dto.LoginRequest;
import com.BloodDonorFinderApp.demo.dto.LoginResponse;
import com.BloodDonorFinderApp.demo.entity.RefreshToken;
import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.repository.RefreshTokenRepository;
import com.BloodDonorFinderApp.demo.repository.UserRepository;
import com.BloodDonorFinderApp.demo.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                refreshTokenRepository,
                passwordEncoder,
                jwtService
        );

        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setName("Jane Doe");
        sampleUser.setEmail("jane.doe@example.com");
        sampleUser.setPassword("encoded_secure_password");
        sampleUser.setPhone("1234567890");
        sampleUser.setRole("USER");
        sampleUser.setEmailVerified(true);
    }

    @Test
    @DisplayName("Login succeeds with mixed-case and trailing whitespace email")
    void login_succeeds_withDifferentCasingAndSurroundingSpaces() {
        // Given a login request with uppercase and leading/trailing whitespace
        LoginRequest request = new LoginRequest();
        request.setEmail("   JANE.DOE@EXAMPLE.COM   ");
        request.setPassword("plainPassword123");

        when(userRepository.findByEmailIgnoreCase("jane.doe@example.com"))
                .thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("plainPassword123", "encoded_secure_password"))
                .thenReturn(true);
        when(jwtService.generateToken(sampleUser))
                .thenReturn("mock_jwt_access_token");
        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        LoginResponse response = authService.login(request);

        // Then
        assertNotNull(response);
        assertEquals("mock_jwt_access_token", response.getToken());
        assertEquals(sampleUser.getEmail(), response.getEmail());
        verify(userRepository).findByEmailIgnoreCase("jane.doe@example.com");
    }

    @Test
    @DisplayName("Login fails when password does not match")
    void login_fails_whenPasswordIsIncorrect() {
        LoginRequest request = new LoginRequest();
        request.setEmail("jane.doe@example.com");
        request.setPassword("wrongPassword");

        when(userRepository.findByEmailIgnoreCase("jane.doe@example.com"))
                .thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongPassword", "encoded_secure_password"))
                .thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.login(request));
        assertEquals("Invalid email or password", ex.getMessage());
        verify(jwtService, never()).generateToken(any());
    }

    @Test
    @DisplayName("Login fails when user does not exist")
    void login_fails_whenUserNotFound() {
        LoginRequest request = new LoginRequest();
        request.setEmail("NONEXISTENT@EXAMPLE.COM");
        request.setPassword("password123");

        when(userRepository.findByEmailIgnoreCase("nonexistent@example.com"))
                .thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.login(request));
        assertEquals("Invalid email or password", ex.getMessage());
        verify(passwordEncoder, never()).matches(any(), any());
    }
}
