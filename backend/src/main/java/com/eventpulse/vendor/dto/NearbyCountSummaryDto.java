package com.eventpulse.vendor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NearbyCountSummaryDto {
    private long total;
    private double radiusKm;
    @Builder.Default
    private Map<String, Long> byCategory = new HashMap<>();
}
