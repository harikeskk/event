package com.eventpulse.vendor.service;

import com.eventpulse.user.entity.User;
import com.eventpulse.vendor.dto.*;

import java.util.List;
import java.util.UUID;

public interface VendorService {
    List<VendorCardDto> searchNearestVendors(double lat, double lng, double radiusKm, String category);
    NearbyCountSummaryDto countNearby(double lat, double lng, double radiusKm);
    VendorDetailDto getVendorDetail(UUID vendorId, Double customerLat, Double customerLng);
    VendorDetailDto getVendorProfileForUser(User user);
    VendorDetailDto updateVendorProfile(User user, VendorProfileUpdateRequest request);
    boolean toggleAvailability(User user);
    PortfolioItemDto addPortfolioItem(User user, PortfolioItemDto itemDto);
    void removePortfolioItem(User user, UUID itemId);
    List<VendorCardDto> getAllVendorsFallback();
}
