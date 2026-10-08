package com.eventpulse.vendor.service.impl;

import com.eventpulse.user.entity.User;
import com.eventpulse.vendor.dto.*;
import com.eventpulse.vendor.entity.PortfolioItem;
import com.eventpulse.vendor.entity.VendorCategory;
import com.eventpulse.vendor.entity.VendorProfile;
import com.eventpulse.vendor.repository.PortfolioItemRepository;
import com.eventpulse.vendor.repository.VendorProfileRepository;
import com.eventpulse.vendor.service.VendorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VendorServiceImpl implements VendorService {

    private final VendorProfileRepository vendorProfileRepository;
    private final PortfolioItemRepository portfolioItemRepository;

    @Override
    @Transactional(readOnly = true)
    public List<VendorCardDto> searchNearestVendors(double lat, double lng, double radiusKm, String category) {
        String cleanCategory = (category != null && !category.trim().equalsIgnoreCase("ALL") && !category.isBlank())
                ? category.trim().toUpperCase()
                : null;

        List<VendorDistanceProjection> projections = vendorProfileRepository.searchNearestVendors(
                lat, lng, radiusKm, cleanCategory
        );

        return projections.stream().map(p -> VendorCardDto.builder()
                .id(p.getId())
                .businessName(p.getBusinessName())
                .category(p.getCategory())
                .description(p.getDescription())
                .addressLine(p.getAddressLine())
                .city(p.getCity())
                .state(p.getState())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .startingPrice(p.getStartingPrice())
                .priceUnit(p.getPriceUnit())
                .ratingAvg(p.getRatingAvg())
                .reviewCount(p.getReviewCount())
                .coverImageUrl(p.getCoverImageUrl())
                .contactPhone(p.getContactPhone())
                .contactEmail(p.getContactEmail())
                .isAvailable(p.getIsAvailable())
                .serviceRadiusKm(p.getServiceRadiusKm())
                .distanceKm(p.getDistanceKm())
                .build()
        ).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public NearbyCountSummaryDto countNearby(double lat, double lng, double radiusKm) {
        List<CategoryCountProjection> counts = vendorProfileRepository.countNearbyByCategory(lat, lng, radiusKm);
        Map<String, Long> categoryMap = new HashMap<>();
        long total = 0;

        for (CategoryCountProjection c : counts) {
            categoryMap.put(c.getCategory(), c.getCount());
            total += c.getCount();
        }

        // Initialize zero counts for any other categories
        for (VendorCategory cat : VendorCategory.values()) {
            categoryMap.putIfAbsent(cat.name(), 0L);
        }

        return NearbyCountSummaryDto.builder()
                .total(total)
                .radiusKm(radiusKm)
                .byCategory(categoryMap)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public VendorDetailDto getVendorDetail(UUID vendorId, Double customerLat, Double customerLng) {
        VendorProfile profile = vendorProfileRepository.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found with id: " + vendorId));

        Double distanceKm = null;
        if (customerLat != null && customerLng != null && profile.getLatitude() != null && profile.getLongitude() != null) {
            distanceKm = calculateDistance(customerLat, customerLng, profile.getLatitude(), profile.getLongitude());
        }

        List<PortfolioItemDto> portfolio = profile.getPortfolioItems().stream()
                .sorted(Comparator.comparing(PortfolioItem::getSortOrder))
                .map(item -> PortfolioItemDto.builder()
                        .id(item.getId())
                        .imageUrl(item.getImageUrl())
                        .title(item.getTitle())
                        .description(item.getDescription())
                        .sortOrder(item.getSortOrder())
                        .build())
                .collect(Collectors.toList());

        return VendorDetailDto.builder()
                .id(profile.getId())
                .businessName(profile.getBusinessName())
                .category(profile.getCategory().name())
                .description(profile.getDescription())
                .addressLine(profile.getAddressLine())
                .city(profile.getCity())
                .state(profile.getState())
                .postalCode(profile.getPostalCode())
                .latitude(profile.getLatitude())
                .longitude(profile.getLongitude())
                .startingPrice(profile.getStartingPrice())
                .priceUnit(profile.getPriceUnit())
                .ratingAvg(profile.getRatingAvg())
                .reviewCount(profile.getReviewCount())
                .coverImageUrl(profile.getCoverImageUrl())
                .contactPhone(profile.getContactPhone())
                .contactEmail(profile.getContactEmail())
                .isAvailable(profile.getIsAvailable())
                .serviceRadiusKm(profile.getServiceRadiusKm())
                .distanceKm(distanceKm != null ? Math.round(distanceKm * 100.0) / 100.0 : null)
                .portfolioItems(portfolio)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public VendorDetailDto getVendorProfileForUser(User user) {
        VendorProfile profile = vendorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("No vendor profile associated with user: " + user.getId()));
        return getVendorDetail(profile.getId(), null, null);
    }

    @Override
    @Transactional
    public VendorDetailDto updateVendorProfile(User user, VendorProfileUpdateRequest request) {
        VendorProfile profile = vendorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("No vendor profile found for this user"));

        if (request.getStartingPrice() != null
                && request.getStartingPrice().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Starting price must be a positive number");
        }
        if (request.getServiceRadiusKm() != null
                && (request.getServiceRadiusKm() < 1 || request.getServiceRadiusKm() > 500)) {
            throw new IllegalArgumentException("Service radius must be between 1 and 500 km");
        }
        if (request.getLatitude() != null
                && (request.getLatitude() < -90.0 || request.getLatitude() > 90.0)) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90");
        }
        if (request.getLongitude() != null
                && (request.getLongitude() < -180.0 || request.getLongitude() > 180.0)) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180");
        }
        if (request.getContactEmail() != null && !request.getContactEmail().trim().isEmpty()
                && !request.getContactEmail().trim().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Valid contact email is required");
        }
        if (request.getContactPhone() != null && !request.getContactPhone().trim().isEmpty()
                && !request.getContactPhone().trim().matches("^\\+?[0-9\\s\\-()]{7,20}$")) {
            throw new IllegalArgumentException("Valid contact phone number is required");
        }

        profile.setBusinessName(request.getBusinessName());
        profile.setCategory(request.getCategory());
        profile.setDescription(request.getDescription());
        profile.setAddressLine(request.getAddressLine());
        profile.setCity(request.getCity());
        profile.setState(request.getState());
        profile.setPostalCode(request.getPostalCode());
        profile.setServiceRadiusKm(request.getServiceRadiusKm() != null ? request.getServiceRadiusKm() : 25);
        if (request.getStartingPrice() != null) {
            profile.setStartingPrice(request.getStartingPrice());
        }
        if (request.getPriceUnit() != null) {
            profile.setPriceUnit(request.getPriceUnit());
        }
        if (request.getIsAvailable() != null) {
            profile.setIsAvailable(request.getIsAvailable());
        }
        if (request.getCoverImageUrl() != null) {
            profile.setCoverImageUrl(request.getCoverImageUrl());
        }
        if (request.getContactPhone() != null) {
            profile.setContactPhone(request.getContactPhone());
        }
        if (request.getContactEmail() != null) {
            profile.setContactEmail(request.getContactEmail());
        }

        profile.updateCoordinates(request.getLatitude(), request.getLongitude());
        vendorProfileRepository.save(profile);

        return getVendorDetail(profile.getId(), null, null);
    }

    @Override
    @Transactional
    public boolean toggleAvailability(User user) {
        VendorProfile profile = vendorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("No vendor profile found for this user"));
        boolean newState = !Boolean.TRUE.equals(profile.getIsAvailable());
        profile.setIsAvailable(newState);
        vendorProfileRepository.save(profile);
        return newState;
    }

    @Override
    @Transactional
    public PortfolioItemDto addPortfolioItem(User user, PortfolioItemDto itemDto) {
        VendorProfile profile = vendorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("No vendor profile found"));

        if (itemDto.getImageUrl() == null || itemDto.getImageUrl().trim().isEmpty()) {
            throw new IllegalArgumentException("Image URL is required");
        }
        if (!itemDto.getImageUrl().trim().matches("^(?i)https?://\\S+$")) {
            throw new IllegalArgumentException("Image URL must start with http:// or https://");
        }
        if (itemDto.getTitle() == null || itemDto.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Title is required");
        }

        PortfolioItem item = PortfolioItem.builder()
                .vendor(profile)
                .imageUrl(itemDto.getImageUrl())
                .title(itemDto.getTitle())
                .description(itemDto.getDescription())
                .sortOrder(itemDto.getSortOrder() != null ? itemDto.getSortOrder() : profile.getPortfolioItems().size())
                .build();

        PortfolioItem saved = portfolioItemRepository.save(item);
        return PortfolioItemDto.builder()
                .id(saved.getId())
                .imageUrl(saved.getImageUrl())
                .title(saved.getTitle())
                .description(saved.getDescription())
                .sortOrder(saved.getSortOrder())
                .build();
    }

    @Override
    @Transactional
    public void removePortfolioItem(User user, UUID itemId) {
        PortfolioItem item = portfolioItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found: " + itemId));
        if (!item.getVendor().getUser().getId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You do not have access to this portfolio item");
        }
        portfolioItemRepository.delete(item);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VendorCardDto> getAllVendorsFallback() {
        return vendorProfileRepository.findAll().stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsAvailable()))
                .map(v -> VendorCardDto.builder()
                        .id(v.getId())
                        .businessName(v.getBusinessName())
                        .category(v.getCategory().name())
                        .description(v.getDescription())
                        .addressLine(v.getAddressLine())
                        .city(v.getCity())
                        .state(v.getState())
                        .latitude(v.getLatitude())
                        .longitude(v.getLongitude())
                        .startingPrice(v.getStartingPrice())
                        .priceUnit(v.getPriceUnit())
                        .ratingAvg(v.getRatingAvg())
                        .reviewCount(v.getReviewCount())
                        .coverImageUrl(v.getCoverImageUrl())
                        .contactPhone(v.getContactPhone())
                        .contactEmail(v.getContactEmail())
                        .isAvailable(v.getIsAvailable())
                        .serviceRadiusKm(v.getServiceRadiusKm())
                        .distanceKm(null)
                        .build()
                ).collect(Collectors.toList());
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
