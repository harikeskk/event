package com.eventpulse.vendor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioItemDto {
    private UUID id;
    private String imageUrl;
    private String title;
    private String description;
    private Integer sortOrder;
}
