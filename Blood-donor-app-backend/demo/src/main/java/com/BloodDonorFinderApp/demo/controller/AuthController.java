package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.dto.LoginRequest;
import com.BloodDonorFinderApp.demo.dto.LoginResponse;
import com.BloodDonorFinderApp.demo.dto.RefreshTokenRequest;
import com.BloodDonorFinderApp.demo.dto.SendOtpRequest;
import com.BloodDonorFinderApp.demo.dto.VerifyOtpRequest;
import com.BloodDonorFinderApp.demo.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody @Valid LoginRequest request,
            HttpServletRequest servletRequest
    ) {
        try {
            LoginResponse response = authService.login(request);

            ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", response.getRefreshToken())
                    .httpOnly(true)
                    .secure(servletRequest.isSecure())
                    .path("/")
                    .maxAge(Duration.ofDays(7))
                    .sameSite("Strict")
                    .build();

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                    .body(response);

        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Invalid email or password"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
            @RequestBody(required = false) RefreshTokenRequest requestBody,
            HttpServletRequest servletRequest
    ) {
        String tokenToUse = cookieRefreshToken;
        if ((tokenToUse == null || tokenToUse.isBlank()) && requestBody != null) {
            tokenToUse = requestBody.getRefreshToken();
        }

        if (tokenToUse == null || tokenToUse.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "No refresh token provided"));
        }

        try {
            LoginResponse response = authService.refreshAccessToken(tokenToUse);

            ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", response.getRefreshToken())
                    .httpOnly(true)
                    .secure(servletRequest.isSecure())
                    .path("/")
                    .maxAge(Duration.ofDays(7))
                    .sameSite("Strict")
                    .build();

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                    .body(response);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
            @RequestBody(required = false) RefreshTokenRequest requestBody,
            HttpServletRequest servletRequest
    ) {
        String tokenToRevoke = cookieRefreshToken;
        if ((tokenToRevoke == null || tokenToRevoke.isBlank()) && requestBody != null) {
            tokenToRevoke = requestBody.getRefreshToken();
        }

        if (tokenToRevoke != null && !tokenToRevoke.isBlank()) {
            authService.revokeRefreshToken(tokenToRevoke);
        }

        ResponseCookie deleteCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(servletRequest.isSecure())
                .path("/")
                .maxAge(0)
                .sameSite("Strict")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .body(Map.of("message", "Logged out successfully"));
    }

    @PostMapping("/send-verification-otp")
    public ResponseEntity<?> sendVerificationOtp(@RequestBody @Valid SendOtpRequest request) {
        try {
            authService.sendVerificationOtp(request.getEmail());
            return ResponseEntity.ok(Map.of(
                    "status", "SUCCESS",
                    "message", "Verification OTP sent to " + request.getEmail()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody @Valid VerifyOtpRequest request) {
        try {
            authService.verifyOtp(request.getEmail(), request.getOtp());
            return ResponseEntity.ok(Map.of(
                    "status", "SUCCESS",
                    "message", "Email verified successfully"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
