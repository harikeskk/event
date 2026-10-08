package com.eventpulse.common;

import com.eventpulse.user.entity.Role;
import com.eventpulse.user.entity.User;
import com.eventpulse.user.repository.UserRepository;
import com.eventpulse.vendor.entity.PortfolioItem;
import com.eventpulse.vendor.entity.VendorCategory;
import com.eventpulse.vendor.entity.VendorProfile;
import com.eventpulse.vendor.repository.PortfolioItemRepository;
import com.eventpulse.vendor.repository.VendorProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VendorProfileRepository vendorProfileRepository;
    private final PortfolioItemRepository portfolioItemRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Checking event marketplace seed data...");

        // 1. Ensure Demo Customer (idempotent — skipped when the email exists)
        if (!userRepository.existsByEmail("customer@example.com")) {
            User customer = User.builder()
                    .email("customer@example.com")
                    .password(passwordEncoder.encode("password123"))
                    .fullName("Sarah Jenkins")
                    .phone("+91 98765 43210")
                    .role(Role.CUSTOMER)
                    .build();
            userRepository.save(customer);
            log.info("Seeded demo customer account.");
        }

        // 2. Create Sample Vendors with coordinates around Bangalore
        createVendor(
                "dj.alex@example.com",
                "DJ Alex Martinez",
                "Sonic Pulse DJ & Audio Visuals",
                VendorCategory.DJ,
                "Award-winning DJ specializing in high-energy wedding receptions, corporate galas, and private cocktail parties. Providing pioneer decks, intelligent moving head lights, and deep subwoofers.",
                "100 Feet Rd, Indiranagar", "Bangalore", "Karnataka", "560038",
                12.9784, 77.6408,
                35,
                BigDecimal.valueOf(25000), "per event",
                4.9, 42,
                "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
                "+91 98111 22334",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80", "Club Night Setup", "Pioneer CDJ 3000 setup with smoke effects"),
                        new PortfolioData("https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80", "Wedding Sangeet DJ", "Outdoor dance floor with laser lighting")
                )
        );

        createVendor(
                "photo.rohit@example.com",
                "Rohit Varma",
                "Lumière Candid & Cinematic Stories",
                VendorCategory.PHOTOGRAPHER,
                "Contemporary wedding and event photographer capturing authentic emotions and timeless portraits. High-end Sony & Leica equipment with same-week teaser deliveries.",
                "5th Block, Koramangala", "Bangalore", "Karnataka", "560095",
                12.9352, 77.6245,
                50,
                BigDecimal.valueOf(45000), "per day",
                5.0, 78,
                "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80",
                "+91 98222 33445",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80", "Sunset Couple Shoot", "Golden hour portrait at lakeside"),
                        new PortfolioData("https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80", "Candid Moments", "Reception party joy")
                )
        );

        createVendor(
                "cater.ananya@example.com",
                "Chef Ananya Sen",
                "Royal Feast Gourmet Catering",
                VendorCategory.CATERER,
                "Exquisite culinary experiences featuring North & South Indian delights, Continental grazing tables, and live wok counters. Sustainable farm-to-table sourcing and hygienic live cooking.",
                "27th Main, HSR Layout", "Bangalore", "Karnataka", "560102",
                12.9121, 77.6446,
                40,
                BigDecimal.valueOf(850), "per plate",
                4.8, 63,
                "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
                "+91 98333 44556",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80", "Artisanal Dessert Bar", "French pastries and Indian fusion sweets"),
                        new PortfolioData("https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80", "Live Buffet Display", "Gourmet banquet spread")
                )
        );

        createVendor(
                "decor.priya@example.com",
                "Priya Sharma",
                "Petal & Glow Bespoke Event Decor",
                VendorCategory.DECORATOR,
                "Transforming venues into magical spaces with floral arches, crystal chandeliers, bohemian canopies, and eco-friendly aesthetic designs for weddings and milestone celebrations.",
                "14th Cross, Jayanagar", "Bangalore", "Karnataka", "560011",
                12.9308, 77.5838,
                30,
                BigDecimal.valueOf(60000), "per event",
                4.9, 39,
                "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80",
                "+91 98444 55667",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80", "Floral Mandap", "Fresh jasmine and rose backdrop"),
                        new PortfolioData("https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80", "Fairylight Canopy", "Evening garden party decor")
                )
        );

        createVendor(
                "venue.vikram@example.com",
                "Vikram Malhotra",
                "The Grand Palm Pavilion & Lawns",
                VendorCategory.VENUE,
                "Sprawling 3-acre heritage garden and luxury air-conditioned banquet hall holding up to 1,200 guests. Complete with bridal suites, valet parking for 300 cars, and in-house green rooms.",
                "ITPL Main Rd, Whitefield", "Bangalore", "Karnataka", "560066",
                12.9698, 77.7499,
                60,
                BigDecimal.valueOf(180000), "per day",
                4.7, 51,
                "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
                "+91 98555 66778",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?auto=format&fit=crop&w=800&q=80", "Grand Ballroom", "Crystal chandeliers with tiered seating"),
                        new PortfolioData("https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80", "Open-air Amphitheater", "Lush green lawn for cocktail hour")
                )
        );

        createVendor(
                "sound.karan@example.com",
                "Karan Nair",
                "Acoustic Pro Concert Sound & Lights",
                VendorCategory.SOUND_LIGHTING,
                "Tour-grade JBL Line Arrays, wireless Shure microphones, haze machines, CO2 jets, and trussing systems for concerts, sangeets, and corporate summits.",
                "15th Cross, JP Nagar", "Bangalore", "Karnataka", "560078",
                12.9063, 77.5857,
                45,
                BigDecimal.valueOf(35000), "per event",
                4.8, 27,
                "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80",
                "+91 98666 77889",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1520523839898-507121633633?auto=format&fit=crop&w=800&q=80", "Truss & Moving Heads", "Full stage lighting design")
                )
        );

        createVendor(
                "emcee.rohan@example.com",
                "Rohan Dsouza",
                "Host Rohan - Bilingual Emcee & Anchor",
                VendorCategory.EMCEE,
                "Charismatic, engaging multilingual anchor (English, Hindi, Kannada) with over 300+ successful stage shows, wedding sangeets, and corporate conferences.",
                "MG Road, Central", "Bangalore", "Karnataka", "560001",
                12.9756, 77.6066,
                50,
                BigDecimal.valueOf(20000), "per event",
                5.0, 48,
                "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
                "+91 98777 88990",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80", "Stage Hosting", "Engaging 800+ attendees at wedding reception")
                )
        );

        // 3. Sample Vendors across Tamil Nadu (Chennai, Madurai, Trichy,
        // Dindigul, Coimbatore, Salem, Tirunelveli)
        createVendor(
                "dj.chennai@example.com",
                "Arjun Mehta",
                "Marina Beatbox DJ Crew",
                VendorCategory.DJ,
                "Chennai's favourite wedding and beach-party DJs with bilingual Tamil-English MCing, LED dance floors, and premium d&b audiotechnik sound.",
                "Oliver Rd, Mylapore", "Chennai", "Tamil Nadu", "600004",
                13.0339, 80.2701,
                40,
                BigDecimal.valueOf(22000), "per event",
                4.8, 35,
                "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
                "+91 98811 22334",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80", "Beach Wedding Party", "Sunset DJ set at Kovalam shoreline")
                )
        );

        createVendor(
                "photo.chennai@example.com",
                "Divya Krishnan",
                "Madras Light Candid Photography",
                VendorCategory.PHOTOGRAPHER,
                "Candid-first wedding storytellers covering muhurthams, receptions, and pre-wedding shoots across ECR farmhouses and Mahabalipuram resorts.",
                "100 Feet Rd, Vadapalani", "Chennai", "Tamil Nadu", "600026",
                13.0500, 80.2120,
                45,
                BigDecimal.valueOf(50000), "per day",
                4.9, 61,
                "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80",
                "+91 98822 33445",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80", "Temple Wedding", "Traditional ceremony coverage in Mylapore")
                )
        );

        createVendor(
                "venue.marina@example.com",
                "Lakshmi Narayanan",
                "Bayview Convention Centre",
                VendorCategory.VENUE,
                "Sea-facing convention centre on ECR with a 900-guest pillarless hall, mango-orchard lawns for muhurthams, and complimentary valet for 250 cars.",
                "East Coast Rd, Neelankarai", "Chennai", "Tamil Nadu", "600115",
                12.9490, 80.2550,
                55,
                BigDecimal.valueOf(150000), "per day",
                4.7, 44,
                "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
                "+91 98833 44556",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80", "Ocean Lawn Muhurtham", "Morning ceremony facing the Bay of Bengal")
                )
        );

        createVendor(
                "cater.madurai@example.com",
                "Chef Karthik Raja",
                "Jasmine City Traditional Catering",
                VendorCategory.CATERER,
                "Authentic Madurai-style banana-leaf sapadu specialists — jigarthanda counters, kari dosa live grills, and wedding elai sappadu for 200 to 5,000 guests.",
                "West Masi St, Madurai Main", "Madurai", "Tamil Nadu", "625001",
                9.9195, 78.1193,
                35,
                BigDecimal.valueOf(550), "per plate",
                4.9, 72,
                "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
                "+91 98911 22334",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80", "Elai Sappadu Spread", "Traditional banana-leaf feast service")
                )
        );

        createVendor(
                "decor.madurai@example.com",
                "Meenakshi Sundaram",
                "Temple Glow Wedding Decor",
                VendorCategory.DECORATOR,
                "Flower-string backdrops, banana-stem entrances, and jasmine-canopy mandapams inspired by Meenakshi temple festivals, plus modern pastel stages.",
                "Anna Nagar Main Rd", "Madurai", "Tamil Nadu", "625020",
                9.9392, 78.1350,
                30,
                BigDecimal.valueOf(45000), "per event",
                4.8, 29,
                "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80",
                "+91 98922 33445",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80", "Jasmine Mandapam", "Temple-style floral stage in Madurai")
                )
        );

        createVendor(
                "dj.trichy@example.com",
                "Sathish Kumar",
                "Rockfort Rhythm DJs",
                VendorCategory.DJ,
                "High-energy Tamil kuthu and Bollywood DJ crew for sangeets, college culturals, and corporate family days across Trichy and Thanjavur.",
                "Thillai Nagar Main Rd", "Tiruchirappalli", "Tamil Nadu", "620018",
                10.7900, 78.6800,
                40,
                BigDecimal.valueOf(18000), "per event",
                4.7, 31,
                "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
                "+91 98933 44556",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80", "College Cultural Night", "EDM night at NIT Trichy fest")
                )
        );

        createVendor(
                "venue.trichy@example.com",
                "Ranganathan Iyer",
                "Srirangam Heritage Mandapam",
                VendorCategory.VENUE,
                "Pillared heritage wedding hall near Srirangam temple for traditional muhurthams up to 600 guests, with dining halls and rooms for the wedding party.",
                "Sannathi St, Srirangam", "Tiruchirappalli", "Tamil Nadu", "620006",
                10.8628, 78.6900,
                35,
                BigDecimal.valueOf(95000), "per day",
                4.8, 26,
                "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?auto=format&fit=crop&w=1200&q=80",
                "+91 98944 55667",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80", "Pillared Hall Decor", "Traditional wedding setup in heritage hall")
                )
        );

        createVendor(
                "cater.dindigul@example.com",
                "Chef Muthu Selvam",
                "Thalappakatti Biryani Catering",
                VendorCategory.CATERER,
                "Dindigul's legendary seeragasamba biryani wedding catering with live dum counters, mutton kola urundai stalls, and paruthi paal dessert bars.",
                "Main Rd, Chinnalapatti", "Dindigul", "Tamil Nadu", "624301",
                10.3000, 77.9300,
                30,
                BigDecimal.valueOf(480), "per plate",
                4.9, 84,
                "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
                "+91 98955 66778",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80", "Biryani Dum Counter", "Live dum biryani service at wedding")
                )
        );

        createVendor(
                "photo.dindigul@example.com",
                "Anitha Devi",
                "Kodaikanal Mist Wedding Films",
                VendorCategory.PHOTOGRAPHER,
                "Mist-laden hill-station pre-wedding shoots around Kodaikanal and candid wedding-day coverage for Dindigul and Theni celebrations.",
                "Gandhi Nagar, Dindigul Town", "Dindigul", "Tamil Nadu", "624001",
                10.3673, 77.9803,
                45,
                BigDecimal.valueOf(38000), "per day",
                4.8, 22,
                "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80",
                "+91 98966 77889",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80", "Hillside Couple Shoot", "Mist portraits above Kodaikanal valley")
                )
        );

        createVendor(
                "makeup.coimbatore@example.com",
                "Revathi Menon",
                "Glowroot Bridal Artistry",
                VendorCategory.MAKEUP_ARTIST,
                "HD and airbrush bridal makeup with traditional Kongu jewellery styling, saree draping, and pre-bridal skincare trials across Coimbatore and Tiruppur.",
                "DB Rd, RS Puram", "Coimbatore", "Tamil Nadu", "641002",
                11.0168, 77.9558,
                30,
                BigDecimal.valueOf(15000), "per session",
                5.0, 47,
                "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1200&q=80",
                "+91 98977 88990",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80", "Muhurtham Look", "Traditional red-gold bridal styling")
                )
        );

        createVendor(
                "sound.coimbatore@example.com",
                "Prakash Raj",
                "Kovai Pro Audio & Lights",
                VendorCategory.SOUND_LIGHTING,
                "Line-array PA, intelligent lighting, and LED video walls for Kongu-region weddings, textile-mill family days, and campus festivals.",
                "Sathy Rd, Ganapathy", "Coimbatore", "Tamil Nadu", "641006",
                11.0300, 76.9300,
                40,
                BigDecimal.valueOf(28000), "per event",
                4.7, 19,
                "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80",
                "+91 98988 99001",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1520523839898-507121633633?auto=format&fit=crop&w=800&q=80", "LED Wall Stage", "Corporate family day production setup")
                )
        );

        createVendor(
                "emcee.salem@example.com",
                "Deepika Rao",
                "Steel City Anchor Deepika",
                VendorCategory.EMCEE,
                "Witty Tamil-English emcee for Salem weddings, school annual days, and showroom launches, with game segments that keep every age group engaged.",
                "Fairlands Main Rd", "Salem", "Tamil Nadu", "636016",
                11.6700, 78.1300,
                35,
                BigDecimal.valueOf(12000), "per event",
                4.8, 24,
                "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
                "+91 98999 00112",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80", "Sangeet Games Night", "Crowd games at Salem wedding reception")
                )
        );

        createVendor(
                "decor.salem@example.com",
                "Vigneshwaran S",
                "Mango Grove Event Styling",
                VendorCategory.DECORATOR,
                "Mango-leaf thoranam entrances, coconut-shell table styling, and farm-wedding stages using Salem's orchards and heritage bungalows.",
                "Omalur Main Rd", "Salem", "Tamil Nadu", "636011",
                11.6643, 78.1460,
                30,
                BigDecimal.valueOf(38000), "per event",
                4.7, 17,
                "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80",
                "+91 98011 22334",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80", "Farm Wedding Stage", "Mango-grove open-air mandapam")
                )
        );

        createVendor(
                "venue.nellai@example.com",
                "Subramanian K",
                "Tamirabarani Riverside Lawns",
                VendorCategory.VENUE,
                "Riverside wedding lawns on the Tamirabarani with a 500-guest dining pavilion, ideal for Tirunelveli-Tuticorin traditional ceremonies.",
                "Palayamkottai Rd", "Tirunelveli", "Tamil Nadu", "627002",
                8.7139, 77.7567,
                40,
                BigDecimal.valueOf(75000), "per day",
                4.8, 21,
                "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
                "+91 98022 33445",
                List.of(
                        new PortfolioData("https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?auto=format&fit=crop&w=800&q=80", "Riverside Reception", "Evening reception by the Tamirabarani")
                )
        );

        log.info("Database seeding successfully completed with sample vendors and customer accounts!");
    }

    private void createVendor(
            String email,
            String ownerName,
            String businessName,
            VendorCategory category,
            String description,
            String address, String city, String state, String zip,
            double lat, double lng,
            int radiusKm,
            BigDecimal price, String priceUnit,
            double rating, int reviews,
            String coverUrl,
            String phone,
            List<PortfolioData> portfolio
    ) {
        // Idempotent: never duplicate seed rows on restart, never touch existing data.
        if (userRepository.existsByEmail(email)) {
            log.debug("Seed vendor {} already exists, skipping.", email);
            return;
        }
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode("password123"))
                .fullName(ownerName)
                .phone(phone)
                .role(Role.VENDOR)
                .build();
        user = userRepository.save(user);

        VendorProfile profile = VendorProfile.builder()
                .user(user)
                .businessName(businessName)
                .category(category)
                .description(description)
                .addressLine(address)
                .city(city)
                .state(state)
                .postalCode(zip)
                .serviceRadiusKm(radiusKm)
                .startingPrice(price)
                .priceUnit(priceUnit)
                .ratingAvg(rating)
                .reviewCount(reviews)
                .coverImageUrl(coverUrl)
                .contactPhone(phone)
                .contactEmail(email)
                .isAvailable(true)
                .build();

        profile.updateCoordinates(lat, lng);
        VendorProfile savedProfile = vendorProfileRepository.save(profile);

        for (int i = 0; i < portfolio.size(); i++) {
            PortfolioData itemData = portfolio.get(i);
            PortfolioItem item = PortfolioItem.builder()
                    .vendor(savedProfile)
                    .imageUrl(itemData.url())
                    .title(itemData.title())
                    .description(itemData.description())
                    .sortOrder(i)
                    .build();
            portfolioItemRepository.save(item);
        }
    }

    private record PortfolioData(String url, String title, String description) {}
}
