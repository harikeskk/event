package com.eventpulse.inquiry.repository;

import com.eventpulse.inquiry.entity.Inquiry;
import com.eventpulse.inquiry.entity.InquiryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, UUID> {
    List<Inquiry> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
    List<Inquiry> findByVendorIdOrderByCreatedAtDesc(UUID vendorId);
    List<Inquiry> findByVendorIdAndStatusOrderByCreatedAtDesc(UUID vendorId, InquiryStatus status);
}
