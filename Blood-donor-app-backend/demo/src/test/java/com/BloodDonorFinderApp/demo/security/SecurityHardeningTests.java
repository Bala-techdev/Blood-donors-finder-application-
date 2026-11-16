package com.BloodDonorFinderApp.demo.security;

import com.BloodDonorFinderApp.demo.config.SecurityConfig;
import com.BloodDonorFinderApp.demo.entity.RefreshToken;
import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.validation.BloodGroupValidator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class SecurityHardeningTests {

    @Test
    @DisplayName("Item 1: JWT secret fail-fast validation when missing or too short")
    void jwtSecret_failFastValidation() {
        SecurityConfig config = new SecurityConfig();

        // Null secret
        ReflectionTestUtils.setField(config, "jwtSecret", null);
        assertThrows(IllegalStateException.class, config::validateJwtSecret);

        // Blank secret
        ReflectionTestUtils.setField(config, "jwtSecret", "   ");
        assertThrows(IllegalStateException.class, config::validateJwtSecret);

        // Short secret (< 32 characters)
        ReflectionTestUtils.setField(config, "jwtSecret", "short_secret_only_24_bytes");
        assertThrows(IllegalStateException.class, config::validateJwtSecret);

        // Valid secret (>= 32 characters)
        ReflectionTestUtils.setField(config, "jwtSecret", "this_is_a_secure_32_byte_secret_key_12345");
        assertDoesNotThrow(config::validateJwtSecret);
    }

    @Test
    @DisplayName("Item 2: CORS rejects wildcard origin patterns and enforces explicit whitelist")
    void corsConfig_restrictsOriginsExplicitly() {
        SecurityConfig config = new SecurityConfig();
        ReflectionTestUtils.setField(
                config,
                "allowedOriginsProperty",
                "http://localhost:5173,http://localhost:3000"
        );

        CorsConfigurationSource source = config.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest();
        CorsConfiguration corsConfig = source.getCorsConfiguration(request);

        assertNotNull(corsConfig);
        assertEquals(List.of("http://localhost:5173", "http://localhost:3000"), corsConfig.getAllowedOrigins());
        assertNull(corsConfig.getAllowedOriginPatterns(), "CORS allowed origin patterns MUST be null (no * wildcard)");
        assertTrue(corsConfig.getAllowCredentials());
    }

    @Test
    @DisplayName("Item 5: Blood group validator accepts valid groups and rejects invalid input")
    void bloodGroupValidator_validatesStrictly() {
        BloodGroupValidator validator = new BloodGroupValidator();

        // Valid groups
        assertTrue(validator.isValid("A+", null));
        assertTrue(validator.isValid("A-", null));
        assertTrue(validator.isValid("B+", null));
        assertTrue(validator.isValid("B-", null));
        assertTrue(validator.isValid("AB+", null));
        assertTrue(validator.isValid("AB-", null));
        assertTrue(validator.isValid("O+", null));
        assertTrue(validator.isValid("O-", null));

        // Invalid groups
        assertFalse(validator.isValid("C+", null));
        assertFalse(validator.isValid("XYZ", null));
        assertFalse(validator.isValid("", null));
        assertFalse(validator.isValid(null, null));
    }

    @Test
    @DisplayName("Item 6: Rate limit filter returns HTTP 429 when login limit is exceeded")
    void rateLimiter_blocksExcessiveLoginAttempts() throws Exception {
        RateLimitFilter rateLimitFilter = new RateLimitFilter();
        ReflectionTestUtils.setField(rateLimitFilter, "loginLimitPerMinute", 5);
        ReflectionTestUtils.setField(rateLimitFilter, "registerLimitPerMinute", 3);
        ReflectionTestUtils.setField(rateLimitFilter, "searchLimitPerMinute", 30);

        String clientIp = "192.168.1.100";

        // First 5 attempts should succeed
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/login");
            req.setRemoteAddr(clientIp);
            MockHttpServletResponse res = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();

            rateLimitFilter.doFilter(req, res, chain);
            assertEquals(200, res.getStatus());
        }

        // 6th attempt must be rejected with 429 Too Many Requests
        MockHttpServletRequest rateLimitedReq = new MockHttpServletRequest("POST", "/api/auth/login");
        rateLimitedReq.setRemoteAddr(clientIp);
        MockHttpServletResponse rateLimitedRes = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        rateLimitFilter.doFilter(rateLimitedReq, rateLimitedRes, chain);
        assertEquals(429, rateLimitedRes.getStatus());
        assertEquals("60", rateLimitedRes.getHeader("Retry-After"));
        assertEquals("application/json", rateLimitedRes.getContentType());
    }

    @Test
    @DisplayName("Item 4 & 7: Refresh token entity tracks expiry and revocation correctly")
    void refreshToken_entityStateValidation() {
        User user = new User("John", "john@example.com", "pass12345", "1234567890", "USER");
        Instant now = Instant.now();

        RefreshToken validToken = new RefreshToken("token_1", user, now.plus(7, ChronoUnit.DAYS));
        assertFalse(validToken.isRevoked());
        assertTrue(validToken.getExpiresAt().isAfter(now));

        RefreshToken expiredToken = new RefreshToken("token_2", user, now.minus(1, ChronoUnit.MINUTES));
        assertTrue(expiredToken.getExpiresAt().isBefore(now));

        validToken.setRevoked(true);
        assertTrue(validToken.isRevoked());
    }
}
