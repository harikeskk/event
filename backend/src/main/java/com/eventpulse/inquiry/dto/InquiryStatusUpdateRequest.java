package com.eventpulse.inquiry.dto;

import com.eventpulse.inquiry.entity.InquiryStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InquiryStatusUpdateRequest {
    @NotNull
    private InquiryStatus status;
    @Size(max = 2000, message = "Vendor notes must not exceed 2000 characters")
    private String vendorNotes;
}
