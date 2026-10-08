package com.eventpulse.auth.dto;

import com.eventpulse.user.entity.Role;
import com.eventpulse.vendor.entity.VendorCategory;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank
    @Email
    @Size(max = 254, message = "Email must be at most 254 characters")
    private String email;

    @NotBlank
    @Size(min = 6, max = 72, message = "Password must be between 6 and 72 characters")
    private String password;

    @NotBlank
    @Size(max = 100, message = "Full name must be at most 100 characters")
    private String fullName;

    @Size(max = 20, message = "Phone must be at most 20 characters")
    private String phone;

    private Role role; // CUSTOMER or VENDOR

    // Vendor specific fields if role == VENDOR
    private String businessName;
    private VendorCategory category;
    private String addressLine;
    private String city;
    private String state;
    private String postalCode;
    private Double latitude;
    private Double longitude;
    private Integer serviceRadiusKm;
    private BigDecimal startingPrice;
    private String description;
    private String coverImageUrl;
}
