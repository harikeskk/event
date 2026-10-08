package com.eventpulse.inquiry.service;

import com.eventpulse.inquiry.dto.InquiryRequest;
import com.eventpulse.inquiry.dto.InquiryResponse;
import com.eventpulse.inquiry.dto.InquiryStatusUpdateRequest;
import com.eventpulse.user.entity.User;

import java.util.List;
import java.util.UUID;

public interface InquiryService {
    InquiryResponse createInquiry(User customer, InquiryRequest request);
    List<InquiryResponse> getCustomerInquiries(User customer);
    InquiryResponse getInquiryById(User principal, UUID inquiryId);
    List<InquiryResponse> getVendorInquiries(User vendorUser);
    InquiryResponse updateInquiryStatus(User vendorUser, UUID inquiryId, InquiryStatusUpdateRequest request);
}
