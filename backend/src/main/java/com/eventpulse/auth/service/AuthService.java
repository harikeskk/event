package com.eventpulse.auth.service;

import com.eventpulse.auth.dto.AuthRequest;
import com.eventpulse.auth.dto.AuthResponse;
import com.eventpulse.auth.dto.RegisterRequest;
import com.eventpulse.config.JwtService;
import com.eventpulse.user.entity.Role;
import com.eventpulse.user.entity.User;
import com.eventpulse.user.repository.UserRepository;
import com.eventpulse.vendor.entity.VendorCategory;
import com.eventpulse.vendor.entity.VendorProfile;
import com.eventpulse.vendor.repository.VendorProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final VendorProfileRepository vendorProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginRateLimiter loginRateLimiter;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();
        if (!loginRateLimiter.tryConsume(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many registration attempts. Please try again later.");
        }
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalStateException("Email is already registered");
        }

        Role role = request.getRole() != null ? request.getRole() : Role.CUSTOMER;
        if (role != Role.CUSTOMER && role != Role.VENDOR) {
            throw new IllegalArgumentException("Registration is only allowed with CUSTOMER or VENDOR role");
        }

        User user = User.builder()
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(role)
                .build();

        try {
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Email is already registered");
        }

        UUID vendorId = null;
        if (role == Role.VENDOR) {
            VendorCategory category = request.getCategory() != null ? request.getCategory() : VendorCategory.DJ;
            String businessName = (request.getBusinessName() != null && !request.getBusinessName().isBlank())
                    ? request.getBusinessName()
                    : request.getFullName() + " Services";

            VendorProfile profile = VendorProfile.builder()
                    .user(user)
                    .businessName(businessName)
                    .category(category)
                    .description(request.getDescription() != null ? request.getDescription() : "Professional " + category + " service provider.")
                    .addressLine(request.getAddressLine())
                    .city(request.getCity())
                    .state(request.getState())
                    .postalCode(request.getPostalCode())
                    .serviceRadiusKm(request.getServiceRadiusKm() != null ? request.getServiceRadiusKm() : 25)
                    .startingPrice(request.getStartingPrice() != null ? request.getStartingPrice() : BigDecimal.valueOf(500))
                    .coverImageUrl(request.getCoverImageUrl())
                    .contactPhone(request.getPhone())
                    .contactEmail(request.getEmail())
                    .isAvailable(true)
                    .ratingAvg(5.0)
                    .reviewCount(1)
                    .build();

            profile.updateCoordinates(request.getLatitude(), request.getLongitude());
            VendorProfile savedProfile = vendorProfileRepository.save(profile);
            vendorId = savedProfile.getId();
        }

        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .vendorId(vendorId)
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();
        if (!loginRateLimiter.tryConsume(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many login attempts. Please try again later.");
        }
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        UUID vendorId = null;
        if (user.getRole() == Role.VENDOR) {
            Optional<VendorProfile> profile = vendorProfileRepository.findByUserId(user.getId());
            if (profile.isPresent()) {
                vendorId = profile.get().getId();
            }
        }

        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .vendorId(vendorId)
                .build();
    }

    public AuthResponse getMe(User user) {
        UUID vendorId = null;
        if (user.getRole() == Role.VENDOR) {
            Optional<VendorProfile> profile = vendorProfileRepository.findByUserId(user.getId());
            if (profile.isPresent()) {
                vendorId = profile.get().getId();
            }
        }

        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .vendorId(vendorId)
                .build();
    }
}
