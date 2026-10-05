package com.shopsphere.config;

import com.shopsphere.entity.Cart;
import com.shopsphere.entity.Category;
import com.shopsphere.entity.Product;
import com.shopsphere.entity.User;
import com.shopsphere.entity.Wishlist;
import com.shopsphere.entity.enums.Role;
import com.shopsphere.repository.CategoryRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${app.admin.email:admin@shopsphere.com}")
    private String adminEmail;

    @org.springframework.beans.factory.annotation.Value("${app.admin.password:Admin@123456}")
    private String adminPassword;

    public DataInitializer(
            UserRepository userRepository,
            CategoryRepository categoryRepository,
            ProductRepository productRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // Seed default Admin if not present
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = new User();
            admin.setName("ShopSphere Admin");
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole(Role.ADMIN);
            admin.setActive(true);
            admin.setPhone("+91 98765 43210");
            userRepository.save(admin);
            log.info("Initialized default admin account: {}", adminEmail);
        }

        // Seed default Customer if not present
        if (!userRepository.existsByEmail("customer@shopsphere.com")) {
            User customer = new User();
            customer.setName("Demo Customer");
            customer.setEmail("customer@shopsphere.com");
            customer.setPassword(passwordEncoder.encode("Customer@123456"));
            customer.setRole(Role.CUSTOMER);
            customer.setActive(true);
            customer.setPhone("+91 91234 56789");

            Cart cart = new Cart(customer);
            Wishlist wishlist = new Wishlist(customer);
            customer.setCart(cart);
            customer.setWishlist(wishlist);

            userRepository.save(customer);
            log.info("Initialized default customer account: customer@shopsphere.com");
        }

        // Seed sample categories & products if none exist
        if (!categoryRepository.existsBySlug("sample-electronics")) {
            Category audio = categoryRepository.findBySlug("audio-headphones").orElseGet(() ->
                    categoryRepository.save(new Category(
                            "Audio & Headphones", "audio-headphones", "🎧", "High-fidelity audio gear and wireless earbuds"
                    ))
            );
            Category wearables = categoryRepository.findBySlug("wearables").orElseGet(() ->
                    categoryRepository.save(new Category(
                            "Wearables", "wearables", "⌚", "Smartwatches, fitness bands and smart accessories"
                    ))
            );
            Category electronics = categoryRepository.findBySlug("sample-electronics").orElseGet(() ->
                    categoryRepository.save(new Category(
                            "Sample Electronics", "sample-electronics", "💻", "Laptops, monitors and computing essentials"
                    ))
            );
            Category home = categoryRepository.findBySlug("home-garden").orElseGet(() ->
                    categoryRepository.save(new Category(
                            "Home & Office", "home-garden", "🏠", "Ergonomic furniture and home accessories"
                    ))
            );

            if (productRepository.count() == 0) {
                Product p1 = new Product(
                        "Aura Wireless Noise-Cancelling Headphones",
                        "SoundCraft",
                        new BigDecimal("299.99"),
                        45,
                        audio
                );
                p1.setOriginalPrice(new BigDecimal("349.99"));
                p1.setDescription("Industry-leading active noise cancellation with 40-hour battery life and spatial audio support.");
                p1.setRating(4.8);
                p1.setReviewCount(128);
                p1.setEmoji("🎧");
                p1.setAccent("#6366f1");
                p1.setImageUrl("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80");
                p1.setActive(true);
                productRepository.save(p1);

                Product p2 = new Product(
                        "PulsePro GPS Smartwatch",
                        "FitTech",
                        new BigDecimal("199.50"),
                        80,
                        wearables
                );
                p2.setOriginalPrice(new BigDecimal("249.99"));
                p2.setDescription("AMOLED display, 24/7 heart rate and blood oxygen tracking, water-resistant up to 50m.");
                p2.setRating(4.6);
                p2.setReviewCount(94);
                p2.setEmoji("⌚");
                p2.setAccent("#0ea5e9");
                p2.setImageUrl("https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80");
                p2.setActive(true);
                productRepository.save(p2);

                Product p3 = new Product(
                        "Clarity 4K Ultra-Wide Monitor",
                        "TechPro",
                        new BigDecimal("499.00"),
                        25,
                        electronics
                );
                p3.setOriginalPrice(new BigDecimal("599.00"));
                p3.setDescription("34-inch curved IPS display, 144Hz refresh rate, HDR400, USB-C 90W power delivery.");
                p3.setRating(4.9);
                p3.setReviewCount(62);
                p3.setEmoji("🖥️");
                p3.setAccent("#8b5cf6");
                p3.setImageUrl("https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80");
                p3.setActive(true);
                productRepository.save(p3);

                Product p4 = new Product(
                        "Mechanical Gaming Keyboard RGB Backlit",
                        "TechPro",
                        new BigDecimal("129.99"),
                        18,
                        electronics
                );
                p4.setOriginalPrice(new BigDecimal("159.99"));
                p4.setDescription("Tactile mechanical switches, aircraft-grade aluminium top plate, and customizable dynamic RGB backlighting.");
                p4.setRating(4.7);
                p4.setReviewCount(84);
                p4.setEmoji("⌨️");
                p4.setAccent("#f43f5e");
                p4.setImageUrl("https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80");
                p4.setActive(true);
                productRepository.save(p4);

                Product p5 = new Product(
                        "Ultra-Slim Portable Laptop Stand",
                        "ErgoDesk",
                        new BigDecimal("49.99"),
                        60,
                        home
                );
                p5.setOriginalPrice(new BigDecimal("69.99"));
                p5.setDescription("Lightweight foldable aluminium stand with 6 adjustable height angles for ergonomic posture and cooling.");
                p5.setRating(4.8);
                p5.setReviewCount(256);
                p5.setEmoji("💻");
                p5.setAccent("#0ea5e9");
                p5.setImageUrl("https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80");
                p5.setActive(true);
                productRepository.save(p5);

                Product p6 = new Product(
                        "Studio Master Studio Monitor Speakers",
                        "SoundCraft",
                        new BigDecimal("219.00"),
                        12,
                        audio
                );
                p6.setOriginalPrice(new BigDecimal("269.00"));
                p6.setDescription("Precision nearfield active studio reference monitors with crystal clear highs and deep bass response.");
                p6.setRating(4.6);
                p6.setReviewCount(41);
                p6.setEmoji("🔊");
                p6.setAccent("#f59e0b");
                p6.setImageUrl("https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80");
                p6.setActive(true);
                productRepository.save(p6);

                log.info("Initialized default categories and rich sample catalog");
            }
        }
    }
}
