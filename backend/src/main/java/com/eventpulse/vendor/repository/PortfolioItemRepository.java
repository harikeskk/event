package com.eventpulse.vendor.repository;

import com.eventpulse.vendor.entity.PortfolioItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PortfolioItemRepository extends JpaRepository<PortfolioItem, UUID> {
    List<PortfolioItem> findByVendorIdOrderBySortOrderAsc(UUID vendorId);
}
