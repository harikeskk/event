package com.eventpulse.config;

import com.eventpulse.user.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    // No default secret committed to source. Set JWT_SECRET / app.jwt.secret in
    // deployment. If absent, a random key is generated at startup (dev-only:
    // tokens do not survive restarts).
    @Value("${app.jwt.secret:}")
    private String secretKey;

    @Value("${app.jwt.expiration-ms:28800000}")
    private long jwtExpiration;

    @PostConstruct
    void validateSecret() {
        if (secretKey == null || secretKey.isBlank()) {
            byte[] random = new byte[32];
            new SecureRandom().nextBytes(random);
            secretKey = Base64.getEncoder().encodeToString(random);
            log.warn("app.jwt.secret is not configured; generated ephemeral JWT key for this run. Set JWT_SECRET in production.");
            return;
        }
        try {
            byte[] keyBytes = Decoders.BASE64.decode(secretKey);
            if (keyBytes.length < 32) {
                throw new IllegalStateException("app.jwt.secret must decode to at least 256 bits");
            }
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("app.jwt.secret must be Base64-encoded with at least 256 bits", e);
        }
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(User user) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", user.getId().toString());
        extraClaims.put("role", user.getRole().name());
        return generateToken(extraClaims, user.getEmail());
    }

    public String generateToken(Map<String, Object> extraClaims, String subject) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignInKey())
                .compact();
    }

    public boolean isTokenValid(String token, String username) {
        final String extractedUsername = extractUsername(token);
        return (extractedUsername.equals(username)) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
