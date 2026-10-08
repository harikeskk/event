package com.eventpulse.auth.dto;

import com.eventpulse.user.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private UUID userId;
    private String email;
    private String fullName;
    private Role role;
    private UUID vendorId;
}
