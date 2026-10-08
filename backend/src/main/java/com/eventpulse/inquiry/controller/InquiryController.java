package com.eventpulse.inquiry.controller;

import com.eventpulse.common.dto.ApiResponse;
import com.eventpulse.inquiry.dto.InquiryRequest;
import com.eventpulse.inquiry.dto.InquiryResponse;
import com.eventpulse.inquiry.dto.InquiryStatusUpdateRequest;
import com.eventpulse.inquiry.service.InquiryService;
import com.eventpulse.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<InquiryResponse>> createInquiry(
            @AuthenticationPrincipal User customer,
            @Valid @RequestBody InquiryRequest request
    ) {
        try {
            InquiryResponse response = inquiryService.createInquiry(customer, request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Booking request sent successfully.", response));
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(ApiResponse.error(e.getReason()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(org.springframework.web.bind.MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .orElse("Validation failed");
        return ResponseEntity.badRequest().body(ApiResponse.error(message));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("You do not have access to this booking"));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleResponseStatus(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(ApiResponse.error(e.getReason()));
    }

    @GetMapping("/my-inquiries")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<List<InquiryResponse>>> getCustomerInquiries(@AuthenticationPrincipal User customer) {
        if (customer == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthenticated"));
        }
        List<InquiryResponse> inquiries = inquiryService.getCustomerInquiries(customer);
        return ResponseEntity.ok(ApiResponse.success("Customer inquiries fetched", inquiries));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InquiryResponse>> getInquiryById(@AuthenticationPrincipal User principal, @PathVariable UUID id) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthenticated"));
        }
        InquiryResponse response = inquiryService.getInquiryById(principal, id);
        return ResponseEntity.ok(ApiResponse.success("Booking fetched", response));
    }

    @GetMapping("/vendor-inbox")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<ApiResponse<List<InquiryResponse>>> getVendorInquiries(@AuthenticationPrincipal User vendorUser) {
        try {
            List<InquiryResponse> inquiries = inquiryService.getVendorInquiries(vendorUser);
            return ResponseEntity.ok(ApiResponse.success("Vendor leads fetched", inquiries));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<ApiResponse<InquiryResponse>> updateInquiryStatus(
            @AuthenticationPrincipal User vendorUser,
            @PathVariable UUID id,
            @Valid @RequestBody InquiryStatusUpdateRequest request
    ) {
        try {
            InquiryResponse updated = inquiryService.updateInquiryStatus(vendorUser, id, request);
            return ResponseEntity.ok(ApiResponse.success("Inquiry status updated", updated));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
