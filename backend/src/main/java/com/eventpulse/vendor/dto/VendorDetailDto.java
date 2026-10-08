package com.eventpulse.vendor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorDetailDto {
    private UUID id;
    private String businessName;
    private String category;
    private String description;
    private String addressLine;
    private String city;
    private String state;
    private String postalCode;
    private Double latitude;
    private Double longitude;
    private BigDecimal startingPrice;
    private String priceUnit;
    private Double ratingAvg;
    private Integer reviewCount;
    private String coverImageUrl;
    private String contactPhone;
    private String contactEmail;
    private Boolean isAvailable;
    private Integer serviceRadiusKm;
    private Double distanceKm;
    @Builder.Default
    private List<PortfolioItemDto> portfolioItems = new ArrayList<>();
}
