package com.eventpulse.inquiry.dto;

import com.eventpulse.inquiry.entity.InquiryStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InquiryResponse {
    private UUID id;
    private UUID customerId;
    private UUID vendorId;
    private String vendorBusinessName;
    private String vendorCategory;
    private String vendorCoverImageUrl;
    private String vendorCity;
    private String vendorAddress;
    private Boolean vendorIsAvailable;
    private String vendorContactEmail;
    private String vendorContactPhone;
    private String eventType;
    private LocalDate eventDate;
    private Integer guestCount;
    private BigDecimal budget;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String message;
    private InquiryStatus status;
    private String vendorNotes;
    private Instant createdAt;
}
