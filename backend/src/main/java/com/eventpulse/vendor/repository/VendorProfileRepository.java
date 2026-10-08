package com.eventpulse.vendor.repository;

import com.eventpulse.vendor.dto.CategoryCountProjection;
import com.eventpulse.vendor.dto.VendorDistanceProjection;
import com.eventpulse.vendor.entity.VendorCategory;
import com.eventpulse.vendor.entity.VendorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VendorProfileRepository extends JpaRepository<VendorProfile, UUID> {

    Optional<VendorProfile> findByUserId(UUID userId);

    @Query(value = """
        SELECT 
            v.id AS id,
            v.business_name AS businessName,
            v.category AS category,
            v.description AS description,
            v.address_line AS addressLine,
            v.city AS city,
            v.state AS state,
            v.latitude AS latitude,
            v.longitude AS longitude,
            v.starting_price AS startingPrice,
            v.price_unit AS priceUnit,
            v.rating_avg AS ratingAvg,
            v.review_count AS reviewCount,
            v.cover_image_url AS coverImageUrl,
            v.contact_phone AS contactPhone,
            v.contact_email AS contactEmail,
            v.is_available AS isAvailable,
            v.service_radius_km AS serviceRadiusKm,
            ROUND(CAST(
                (6371 * acos(
                    cos(radians(:lat)) * cos(radians(v.latitude)) *
                    cos(radians(v.longitude) - radians(:lng)) +
                    sin(radians(:lat)) * sin(radians(v.latitude))
                )) AS numeric), 2
            ) AS distanceKm
        FROM vendor_profiles v
        WHERE v.is_available = true
          AND v.latitude IS NOT NULL 
          AND v.longitude IS NOT NULL
          AND (:category IS NULL OR v.category = :category)
          AND (
            6371 * acos(
                cos(radians(:lat)) * cos(radians(v.latitude)) *
                cos(radians(v.longitude) - radians(:lng)) +
                sin(radians(:lat)) * sin(radians(v.latitude))
            )
          ) <= :radiusKm
        ORDER BY distanceKm ASC
        """, nativeQuery = true)
    List<VendorDistanceProjection> searchNearestVendors(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusKm") double radiusKm,
            @Param("category") String category
    );

    @Query(value = """
        SELECT 
            v.category AS category,
            COUNT(v.id) AS count
        FROM vendor_profiles v
        WHERE v.is_available = true
          AND v.latitude IS NOT NULL 
          AND v.longitude IS NOT NULL
          AND (
            6371 * acos(
                cos(radians(:lat)) * cos(radians(v.latitude)) *
                cos(radians(v.longitude) - radians(:lng)) +
                sin(radians(:lat)) * sin(radians(v.latitude))
            )
          ) <= :radiusKm
        GROUP BY v.category
        """, nativeQuery = true)
    List<CategoryCountProjection> countNearbyByCategory(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusKm") double radiusKm
    );

    List<VendorProfile> findByCategory(VendorCategory category);
}
