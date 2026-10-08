package com.eventpulse.vendor.entity;

import com.eventpulse.user.entity.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "vendor_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnore
    private User user;

    @Column(nullable = false)
    private String businessName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VendorCategory category;

    @Column(length = 2000)
    private String description;

    private String addressLine;
    private String city;
    private String state;
    private String postalCode;

    private Double latitude;
    private Double longitude;

    @Builder.Default
    private Integer serviceRadiusKm = 25;

    private BigDecimal startingPrice;

    @Builder.Default
    private String priceUnit = "per event";

    @Builder.Default
    private Boolean isAvailable = true;

    @Builder.Default
    private Double ratingAvg = 4.8;

    @Builder.Default
    private Integer reviewCount = 0;

    private String coverImageUrl;
    private String contactPhone;
    private String contactEmail;

    @OneToMany(mappedBy = "vendor", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PortfolioItem> portfolioItems = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    public void updateCoordinates(Double lat, Double lng) {
        this.latitude = lat;
        this.longitude = lng;
    }
}
