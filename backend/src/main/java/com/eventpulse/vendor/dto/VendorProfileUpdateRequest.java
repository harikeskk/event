package com.eventpulse.vendor.dto;

import com.eventpulse.vendor.entity.VendorCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorProfileUpdateRequest {
    @NotBlank
    private String businessName;

    @NotNull
    private VendorCategory category;

    private String description;
    private String addressLine;
    private String city;
    private String state;
    private String postalCode;

    private Double latitude;
    private Double longitude;

    private Integer serviceRadiusKm;
    private BigDecimal startingPrice;
    private String priceUnit;
    private Boolean isAvailable;
    private String coverImageUrl;
    private String contactPhone;
    private String contactEmail;
}
