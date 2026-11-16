package com.BloodDonorFinderApp.demo.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${rate-limit.login-per-minute:5}")
    private int loginLimitPerMinute;

    @Value("${rate-limit.register-per-minute:3}")
    private int registerLimitPerMinute;

    @Value("${rate-limit.search-per-minute:30}")
    private int searchLimitPerMinute;

    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    private static class TokenBucket {
        private final int capacity;
        private final double refillRatePerSecond;
        private double tokens;
        private long lastRefillTimestamp;

        public TokenBucket(int capacity) {
            this.capacity = capacity;
            this.tokens = capacity;
            this.refillRatePerSecond = (double) capacity / 60.0;
            this.lastRefillTimestamp = System.currentTimeMillis();
        }

        public synchronized boolean tryConsume() {
            refill();
            if (tokens >= 1.0) {
                tokens -= 1.0;
                return true;
            }
            return false;
        }

        private void refill() {
            long now = System.currentTimeMillis();
            double secondsElapsed = (now - lastRefillTimestamp) / 1000.0;
            tokens = Math.min(capacity, tokens + secondsElapsed * refillRatePerSecond);
            lastRefillTimestamp = now;
        }
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();
        String clientIp = extractClientIp(request);

        boolean isLogin = "POST".equalsIgnoreCase(method) && path.endsWith("/api/auth/login");
        boolean isRegister = "POST".equalsIgnoreCase(method) && (path.endsWith("/api/users") || path.endsWith("/api/auth/register"));
        boolean isSearch = "GET".equalsIgnoreCase(method) && path.contains("/api/donors/search");

        if (isLogin) {
            String bucketKey = "login:" + clientIp;
            if (!allowRequest(bucketKey, loginLimitPerMinute)) {
                rejectRateLimited(response, 60, "Login rate limit exceeded. Max 5 attempts per minute.");
                return;
            }
        } else if (isRegister) {
            String bucketKey = "register:" + clientIp;
            if (!allowRequest(bucketKey, registerLimitPerMinute)) {
                rejectRateLimited(response, 60, "Registration rate limit exceeded. Max 3 attempts per minute.");
                return;
            }
        } else if (isSearch) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String userIdentifier = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal()))
                    ? auth.getName()
                    : clientIp;
            String bucketKey = "search:" + userIdentifier;
            if (!allowRequest(bucketKey, searchLimitPerMinute)) {
                rejectRateLimited(response, 60, "Donor search rate limit exceeded. Max 30 requests per minute.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean allowRequest(String key, int capacity) {
        TokenBucket bucket = buckets.computeIfAbsent(key, k -> new TokenBucket(capacity));
        return bucket.tryConsume();
    }

    private void rejectRateLimited(HttpServletResponse response, int retryAfterSeconds, String message) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        String json = "{\"timestamp\":\"" + Instant.now() + "\",\"status\":429,\"error\":\"Too Many Requests\",\"message\":\""
                + message.replace("\"", "\\\"") + "\",\"retryAfterSeconds\":" + retryAfterSeconds + "}";

        response.getWriter().write(json);
        response.getWriter().flush();
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
