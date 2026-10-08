package com.eventpulse.vendor.controller;

import com.eventpulse.common.dto.ApiResponse;
import com.eventpulse.vendor.dto.NearbyCountSummaryDto;
import com.eventpulse.vendor.dto.VendorCardDto;
import com.eventpulse.vendor.dto.VendorDetailDto;
import com.eventpulse.vendor.service.VendorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/vendors")
@RequiredArgsConstructor
public class VendorDiscoveryController {

    private final VendorService vendorService;

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<VendorCardDto>>> searchVendors(
            @RequestParam(required = false, defaultValue = "12.9716") double lat,
            @RequestParam(required = false, defaultValue = "77.5946") double lng,
            @RequestParam(required = false, defaultValue = "50.0") double radiusKm,
            @RequestParam(required = false) String category
    ) {
        List<VendorCardDto> results = vendorService.searchNearestVendors(lat, lng, radiusKm, category);
        results.forEach(v -> {
            v.setContactPhone(null);
            v.setContactEmail(null);
        });
        return ResponseEntity.ok(ApiResponse.success("Vendors found", results));
    }

    @GetMapping("/count-nearby")
    public ResponseEntity<ApiResponse<NearbyCountSummaryDto>> countNearby(
            @RequestParam(required = false, defaultValue = "12.9716") double lat,
            @RequestParam(required = false, defaultValue = "77.5946") double lng,
            @RequestParam(required = false, defaultValue = "50.0") double radiusKm
    ) {
        NearbyCountSummaryDto summary = vendorService.countNearby(lat, lng, radiusKm);
        return ResponseEntity.ok(ApiResponse.success("Nearby counts calculated", summary));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VendorDetailDto>> getVendorDetail(
            @PathVariable UUID id,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng
    ) {
        try {
            VendorDetailDto detail = vendorService.getVendorDetail(id, lat, lng);
            detail.setContactPhone(null);
            detail.setContactEmail(null);
            return ResponseEntity.ok(ApiResponse.success("Vendor profile fetched", detail));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Vendor not found"));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<VendorCardDto>>> getAllVendors() {
        List<VendorCardDto> results = vendorService.getAllVendorsFallback();
        results.forEach(v -> {
            v.setContactPhone(null);
            v.setContactEmail(null);
        });
        return ResponseEntity.ok(ApiResponse.success("All vendors", results));
    }

    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Vendor not found"));
    }
}
