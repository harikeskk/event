package com.eventpulse.inquiry.service.impl;

import com.eventpulse.inquiry.dto.InquiryRequest;
import com.eventpulse.inquiry.dto.InquiryResponse;
import com.eventpulse.inquiry.dto.InquiryStatusUpdateRequest;
import com.eventpulse.inquiry.entity.Inquiry;
import com.eventpulse.inquiry.entity.InquiryStatus;
import com.eventpulse.inquiry.repository.InquiryRepository;
import com.eventpulse.inquiry.service.InquiryService;
import com.eventpulse.user.entity.User;
import com.eventpulse.vendor.entity.VendorProfile;
import com.eventpulse.vendor.repository.VendorProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InquiryServiceImpl implements InquiryService {

    private final InquiryRepository inquiryRepository;
    private final VendorProfileRepository vendorProfileRepository;

    @Override
    @Transactional
    public InquiryResponse createInquiry(User customer, InquiryRequest request) {
        if (customer == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required to submit booking requests");
        }

        VendorProfile vendor = vendorProfileRepository.findById(request.getVendorId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found"));

        if (!Boolean.TRUE.equals(vendor.getIsAvailable())) {
            throw new IllegalStateException("This vendor is not accepting bookings right now");
        }

        if (request.getEventDate() != null && request.getEventDate().isBefore(java.time.LocalDate.now())) {
            throw new IllegalArgumentException("Event date must be today or in the future");
        }

        if (request.getGuestCount() != null && request.getGuestCount() <= 0) {
            throw new IllegalArgumentException("Guest count must be positive");
        }

        if (request.getBudget() != null && request.getBudget().compareTo(java.math.BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Budget must not be negative");
        }

        if (request.getMessage() != null && request.getMessage().trim().length() < 10) {
            throw new IllegalArgumentException("Message must be at least 10 characters long");
        }

        Inquiry inquiry = Inquiry.builder()
                .customer(customer)
                .vendor(vendor)
                .eventType(request.getEventType())
                .eventDate(request.getEventDate())
                .guestCount(request.getGuestCount())
                .budget(request.getBudget())
                .customerName(request.getCustomerName() != null ? request.getCustomerName() : customer.getFullName())
                .customerEmail(request.getCustomerEmail() != null ? request.getCustomerEmail() : customer.getEmail())
                .customerPhone(request.getCustomerPhone() != null ? request.getCustomerPhone() : customer.getPhone())
                .message(request.getMessage())
                .status(InquiryStatus.PENDING)
                .build();

        Inquiry saved = inquiryRepository.save(inquiry);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InquiryResponse> getCustomerInquiries(User customer) {
        return inquiryRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public InquiryResponse getInquiryById(User principal, UUID inquiryId) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inquiry not found"));

        boolean isCustomer = inquiry.getCustomer().getId().equals(principal.getId());
        boolean isVendor = inquiry.getVendor().getUser().getId().equals(principal.getId());
        if (!isCustomer && !isVendor) {
            throw new AccessDeniedException("You do not have access to this booking");
        }

        return mapToResponse(inquiry);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InquiryResponse> getVendorInquiries(User vendorUser) {
        VendorProfile vendor = vendorProfileRepository.findByUserId(vendorUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("No vendor profile associated with user"));
        return inquiryRepository.findByVendorIdOrderByCreatedAtDesc(vendor.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InquiryResponse updateInquiryStatus(User vendorUser, UUID inquiryId, InquiryStatusUpdateRequest request) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inquiry not found"));

        if (!inquiry.getVendor().getUser().getId().equals(vendorUser.getId())) {
            throw new AccessDeniedException("You do not have access to this booking");
        }

        InquiryStatus current = inquiry.getStatus();
        InquiryStatus next = request.getStatus();
        if (next != current && !isValidTransition(current, next)) {
            throw new IllegalStateException(
                    "Cannot change booking status from " + current + " to " + next);
        }

        inquiry.setStatus(next);
        if (request.getVendorNotes() != null) {
            inquiry.setVendorNotes(request.getVendorNotes());
        }

        Inquiry updated = inquiryRepository.save(inquiry);
        return mapToResponse(updated);
    }

    private boolean isValidTransition(InquiryStatus from, InquiryStatus to) {
        return switch (from) {
            case PENDING -> to == InquiryStatus.ACCEPTED || to == InquiryStatus.DECLINED;
            case ACCEPTED -> to == InquiryStatus.COMPLETED;
            default -> false;
        };
    }

    private boolean isContactVisible(Inquiry inquiry) {
        return inquiry.getStatus() == InquiryStatus.ACCEPTED
                || inquiry.getStatus() == InquiryStatus.COMPLETED;
    }

    private InquiryResponse mapToResponse(Inquiry inquiry) {
        VendorProfile vendor = inquiry.getVendor();
        boolean contactVisible = isContactVisible(inquiry);
        return InquiryResponse.builder()
                .id(inquiry.getId())
                .customerId(inquiry.getCustomer().getId())
                .vendorId(vendor.getId())
                .vendorBusinessName(vendor.getBusinessName())
                .vendorCategory(vendor.getCategory().name())
                .vendorCoverImageUrl(vendor.getCoverImageUrl())
                .vendorContactEmail(contactVisible ? vendor.getContactEmail() : null)
                .vendorContactPhone(contactVisible ? vendor.getContactPhone() : null)
                .eventType(inquiry.getEventType())
                .eventDate(inquiry.getEventDate())
                .guestCount(inquiry.getGuestCount())
                .budget(inquiry.getBudget())
                .customerName(inquiry.getCustomerName())
                .customerEmail(inquiry.getCustomerEmail())
                .customerPhone(inquiry.getCustomerPhone())
                .message(inquiry.getMessage())
                .status(inquiry.getStatus())
                .vendorNotes(inquiry.getVendorNotes())
                .createdAt(inquiry.getCreatedAt())
                .build();
    }
}
