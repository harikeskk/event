package com.eventpulse.vendor.dto;

import java.math.BigDecimal;
import java.util.UUID;

public interface VendorDistanceProjection {
    UUID getId();
    String getBusinessName();
    String getCategory();
    String getDescription();
    String getAddressLine();
    String getCity();
    String getState();
    Double getLatitude();
    Double getLongitude();
    BigDecimal getStartingPrice();
    String getPriceUnit();
    Double getRatingAvg();
    Integer getReviewCount();
    String getCoverImageUrl();
    String getContactPhone();
    String getContactEmail();
    Boolean getIsAvailable();
    Integer getServiceRadiusKm();
    Double getDistanceKm();
}
