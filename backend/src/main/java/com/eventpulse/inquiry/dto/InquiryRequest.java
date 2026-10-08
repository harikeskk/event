package com.eventpulse.inquiry.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InquiryRequest {

    @NotNull(message = "Vendor ID is required")
    private UUID vendorId;

    @NotBlank(message = "Event type is required")
    private String eventType;

    @NotNull(message = "Event date is required")
    @FutureOrPresent(message = "Event date must be today or in the future")
    private LocalDate eventDate;

    @Positive(message = "Guest count must be positive")
    private Integer guestCount;

    @PositiveOrZero(message = "Budget must be positive or zero")
    private BigDecimal budget;

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Customer email is required")
    @Email(message = "Valid email address is required")
    private String customerEmail;

    @Pattern(regexp = "^$|^\\+?[0-9\\s\\-()]{7,20}$", message = "Valid phone number is required")
    private String customerPhone;

    @NotBlank(message = "Message is required")
    @Size(min = 10, max = 2000, message = "Message must be between 10 and 2000 characters")
    private String message;
}
