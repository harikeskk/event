package com.eventpulse.auth.service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory sliding-window rate limiter for authentication endpoints.
 * Keyed by client IP + account identifier (email) so brute-force against a
 * single account and distributed credential-stuffing from a single IP are
 * both throttled, without permanently blocking legitimate users.
 * Window and limit are configurable via application properties.
 */
@Component
public class LoginRateLimiter {

    private final int maxAttempts;
    private final Duration window;
    private final ConcurrentHashMap<String, Deque<Instant>> attempts = new ConcurrentHashMap<>();

    public LoginRateLimiter(
            @Value("${app.auth.rate-limit.max-attempts:10}") int maxAttempts,
            @Value("${app.auth.rate-limit.window-ms:300000}") long windowMs) {
        this.maxAttempts = maxAttempts;
        this.window = Duration.ofMillis(windowMs);
    }

    /**
     * @param email account identifier (already normalized to lowercase/trimmed by caller)
     * @return true if the attempt is allowed, false if the rate limit is exceeded
     */
    public boolean tryConsume(String email) {
        String key = resolveClientIp() + "|" + (email == null ? "" : email.toLowerCase().trim());
        Instant now = Instant.now();
        Deque<Instant> deque = attempts.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (deque) {
            while (!deque.isEmpty() && deque.peekFirst().isBefore(now.minus(window))) {
                deque.pollFirst();
            }
            if (deque.size() >= maxAttempts) {
                return false;
            }
            deque.addLast(now);
            return true;
        }
    }

    private String resolveClientIp() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String forwarded = request.getHeader("X-Forwarded-For");
                if (forwarded != null && !forwarded.isBlank()) {
                    return forwarded.split(",")[0].trim();
                }
                return request.getRemoteAddr();
            }
        } catch (Exception ignored) {
            // fall through to unknown — never fail auth on IP resolution
        }
        return "unknown";
    }
}
