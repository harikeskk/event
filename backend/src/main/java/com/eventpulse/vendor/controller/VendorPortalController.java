package com.eventpulse.vendor.controller;

import com.eventpulse.common.dto.ApiResponse;
import com.eventpulse.user.entity.User;
import com.eventpulse.vendor.dto.PortfolioItemDto;
import com.eventpulse.vendor.dto.VendorDetailDto;
import com.eventpulse.vendor.dto.VendorProfileUpdateRequest;
import com.eventpulse.vendor.service.VendorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/vendor-portal")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VENDOR')")
public class VendorPortalController {

    private final VendorService vendorService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<VendorDetailDto>> getMyProfile(@AuthenticationPrincipal User user) {
        VendorDetailDto detail = vendorService.getVendorProfileForUser(user);
        return ResponseEntity.ok(ApiResponse.success("Vendor profile fetched", detail));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<VendorDetailDto>> updateMyProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody VendorProfileUpdateRequest request
    ) {
        VendorDetailDto updated = vendorService.updateVendorProfile(user, request);
        return ResponseEntity.ok(ApiResponse.success("Vendor profile updated", updated));
    }

    @PatchMapping("/availability")
    public ResponseEntity<ApiResponse<Boolean>> toggleAvailability(@AuthenticationPrincipal User user) {
        boolean newState = vendorService.toggleAvailability(user);
        return ResponseEntity.ok(ApiResponse.success("Availability updated to " + newState, newState));
    }

    @PostMapping("/portfolio")
    public ResponseEntity<ApiResponse<PortfolioItemDto>> addPortfolioItem(
            @AuthenticationPrincipal User user,
            @RequestBody PortfolioItemDto itemDto
    ) {
        PortfolioItemDto added = vendorService.addPortfolioItem(user, itemDto);
        return ResponseEntity.ok(ApiResponse.success("Portfolio item added", added));
    }

    @DeleteMapping("/portfolio/{itemId}")
    public ResponseEntity<ApiResponse<Void>> deletePortfolioItem(
            @AuthenticationPrincipal User user,
            @PathVariable UUID itemId
    ) {
        vendorService.removePortfolioItem(user, itemId);
        return ResponseEntity.ok(ApiResponse.success("Portfolio item removed", null));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(org.springframework.security.access.AccessDeniedException e) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("You do not have access to this portfolio item"));
    }
    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(org.springframework.web.bind.MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .orElse("Validation failed");
        return ResponseEntity.badRequest().body(ApiResponse.error(message));
    }
}
