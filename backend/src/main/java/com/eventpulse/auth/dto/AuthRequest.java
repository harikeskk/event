package com.eventpulse.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthRequest {
    @Email
    @NotBlank
    @Size(max = 254, message = "Email must be at most 254 characters")
    private String email;

    @NotBlank
    @Size(max = 72, message = "Password must be at most 72 characters")
    private String password;
}
