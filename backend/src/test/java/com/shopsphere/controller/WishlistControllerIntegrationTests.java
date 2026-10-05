package com.shopsphere.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.entity.Category;
import com.shopsphere.entity.Product;
import com.shopsphere.entity.User;
import com.shopsphere.entity.enums.Role;
import com.shopsphere.repository.CategoryRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.repository.UserRepository;
import com.shopsphere.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class WishlistControllerIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testCustomer;
    private String customerToken;
    private Product testProduct1;
    private Product testProduct2;

    @BeforeEach
    void setUp() {
        Category category = categoryRepository.findAll().stream().findFirst().orElseGet(() -> {
            Category c = new Category();
            c.setName("Electronics Wishlist " + System.currentTimeMillis());
            c.setSlug("electronics-test-" + System.currentTimeMillis());
            return categoryRepository.save(c);
        });

        testProduct1 = new Product();
        testProduct1.setName("Wireless Noise-Canceling Headphones");
        testProduct1.setBrand("SoundMaster");
        testProduct1.setPrice(new BigDecimal("299.99"));
        testProduct1.setOriginalPrice(new BigDecimal("399.99"));
        testProduct1.setStockQuantity(50);
        testProduct1.setActive(true);
        testProduct1.setCategory(category);
        testProduct1 = productRepository.save(testProduct1);

        testProduct2 = new Product();
        testProduct2.setName("Smart Fitness Watch");
        testProduct2.setBrand("FitPulse");
        testProduct2.setPrice(new BigDecimal("199.99"));
        testProduct2.setStockQuantity(20);
        testProduct2.setActive(true);
        testProduct2.setCategory(category);
        testProduct2 = productRepository.save(testProduct2);

        testCustomer = new User();
        testCustomer.setName("Wishlist Customer");
        testCustomer.setEmail("wishlist.customer." + System.currentTimeMillis() + "@shopsphere.com");
        testCustomer.setPassword(passwordEncoder.encode("Password@123"));
        testCustomer.setRole(Role.CUSTOMER);
        testCustomer.setActive(true);
        testCustomer = userRepository.save(testCustomer);

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", testCustomer.getId());
        claims.put("role", "CUSTOMER");
        customerToken = jwtService.generateToken(
                claims,
                org.springframework.security.core.userdetails.User
                        .withUsername(testCustomer.getEmail())
                        .password("dummy")
                        .authorities("ROLE_CUSTOMER")
                        .build()
        );
    }

    @Test
    @DisplayName("GET /api/wishlist - Retrieve empty wishlist for authenticated user")
    void testGetEmptyWishlist() throws Exception {
        mockMvc.perform(get("/api/wishlist")
                        .header("Authorization", "Bearer " + customerToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items", hasSize(0)))
                .andExpect(jsonPath("$.data.totalItems").value(0));
    }

    @Test
    @DisplayName("POST /api/wishlist/{productId} - Add product to wishlist")
    void testAddProductToWishlist() throws Exception {
        mockMvc.perform(post("/api/wishlist/" + testProduct1.getId())
                        .header("Authorization", "Bearer " + customerToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].productId").value(testProduct1.getId()))
                .andExpect(jsonPath("$.data.items[0].productName").value(testProduct1.getName()))
                .andExpect(jsonPath("$.data.items[0].productBrand").value("SoundMaster"))
                .andExpect(jsonPath("$.data.totalItems").value(1));
    }

    @Test
    @DisplayName("POST /api/wishlist/{productId} - Prevent duplicate wishlist entries")
    void testPreventDuplicateWishlistEntries() throws Exception {
        // First addition
        mockMvc.perform(post("/api/wishlist/" + testProduct1.getId())
                        .header("Authorization", "Bearer " + customerToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(1));

        // Duplicate addition attempt of same product
        mockMvc.perform(post("/api/wishlist/" + testProduct1.getId())
                        .header("Authorization", "Bearer " + customerToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.totalItems").value(1));
    }

    @Test
    @DisplayName("DELETE /api/wishlist/{productId} - Remove product from wishlist")
    void testRemoveProductFromWishlist() throws Exception {
        // Add item
        mockMvc.perform(post("/api/wishlist/" + testProduct1.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk());

        // Remove item
        mockMvc.perform(delete("/api/wishlist/" + testProduct1.getId())
                        .header("Authorization", "Bearer " + customerToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items", hasSize(0)))
                .andExpect(jsonPath("$.data.totalItems").value(0));
    }

    @Test
    @DisplayName("POST /api/wishlist/{productId}/move-to-cart - Move product to cart")
    void testMoveToCart() throws Exception {
        // Add item to wishlist
        mockMvc.perform(post("/api/wishlist/" + testProduct1.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk());

        // Move to cart
        mockMvc.perform(post("/api/wishlist/" + testProduct1.getId() + "/move-to-cart")
                        .header("Authorization", "Bearer " + customerToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items", hasSize(0)));

        // Verify item is now in cart
        mockMvc.perform(get("/api/cart")
                        .header("Authorization", "Bearer " + customerToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].productId").value(testProduct1.getId()));
    }

    @Test
    @DisplayName("GET /api/wishlist - Unauthenticated request rejected (401)")
    void testUnauthenticatedWishlistRejected() throws Exception {
        mockMvc.perform(get("/api/wishlist")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/wishlist/{productId} - Nonexistent product rejected (404)")
    void testAddNonexistentProduct() throws Exception {
        mockMvc.perform(post("/api/wishlist/999999")
                        .header("Authorization", "Bearer " + customerToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}
