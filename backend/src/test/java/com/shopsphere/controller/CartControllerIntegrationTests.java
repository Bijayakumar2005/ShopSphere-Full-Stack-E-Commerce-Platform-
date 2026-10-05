package com.shopsphere.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.dto.request.CartItemRequestDto;
import com.shopsphere.dto.request.CartItemUpdateRequestDto;
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
import org.springframework.test.web.servlet.MvcResult;
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
public class CartControllerIntegrationTests {

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

    private String customerToken;
    private User testCustomer;
    private Product inStockProduct;
    private Product lowStockProduct;

    @BeforeEach
    void setUp() {
        // Create test customer
        testCustomer = new User();
        testCustomer.setName("Cart Tester");
        testCustomer.setEmail("cartuser@shopsphere.com");
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

        Category category = categoryRepository.save(new Category(
                "Electronics", "electronics", "💻", "Electronics category"
        ));

        inStockProduct = new Product(
                "Wireless Pro Headphones",
                "SoundCraft",
                new BigDecimal("100.00"),
                10,
                category
        );
        inStockProduct.setOriginalPrice(new BigDecimal("150.00"));
        inStockProduct.setActive(true);
        inStockProduct = productRepository.save(inStockProduct);

        lowStockProduct = new Product(
                "Limited Edition Keyboard",
                "KeyMaster",
                new BigDecimal("200.00"),
                2,
                category
        );
        lowStockProduct.setActive(true);
        lowStockProduct = productRepository.save(lowStockProduct);
    }

    @Test
    @DisplayName("GET /api/cart requires authentication")
    void testGetCartUnauthorized() throws Exception {
        mockMvc.perform(get("/api/cart"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/cart returns empty cart initially")
    void testGetCartEmpty() throws Exception {
        mockMvc.perform(get("/api/cart")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalItems", is(0)))
                .andExpect(jsonPath("$.data.subtotal", is(0)))
                .andExpect(jsonPath("$.data.totalAmount", is(0)))
                .andExpect(jsonPath("$.data.items", hasSize(0)));
    }

    @Test
    @DisplayName("POST /api/cart/items adds product and computes server-authoritative totals")
    void testAddToCartSuccess() throws Exception {
        CartItemRequestDto req = new CartItemRequestDto(inStockProduct.getId(), 2);

        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalItems", is(2)))
                .andExpect(jsonPath("$.data.subtotal", is(200.00)))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].productId", is(inStockProduct.getId().intValue())))
                .andExpect(jsonPath("$.data.items[0].quantity", is(2)))
                .andExpect(jsonPath("$.data.items[0].productPrice", is(100.00)))
                .andExpect(jsonPath("$.data.items[0].subtotal", is(200.00)));
    }

    @Test
    @DisplayName("POST /api/cart/items rejects when quantity exceeds available stock")
    void testAddToCartExceedsStock() throws Exception {
        // lowStockProduct only has 2 in stock, request 5
        CartItemRequestDto req = new CartItemRequestDto(lowStockProduct.getId(), 5);

        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("exceeds available stock")));
    }

    @Test
    @DisplayName("POST /api/cart/items on existing item increments quantity safely")
    void testAddToCartIncrementsExisting() throws Exception {
        CartItemRequestDto req1 = new CartItemRequestDto(inStockProduct.getId(), 2);
        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        CartItemRequestDto req2 = new CartItemRequestDto(inStockProduct.getId(), 3);
        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.totalItems", is(5)))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].quantity", is(5)))
                .andExpect(jsonPath("$.data.subtotal", is(500.00)));
    }

    @Test
    @DisplayName("PUT /api/cart/items/{id} updates quantity and recalculates totals")
    void testUpdateCartItemQuantity() throws Exception {
        // Add 1 item first
        CartItemRequestDto addReq = new CartItemRequestDto(inStockProduct.getId(), 1);
        MvcResult addResult = mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String responseJson = addResult.getResponse().getContentAsString();
        Number itemId = com.jayway.jsonpath.JsonPath.read(responseJson, "$.data.items[0].id");

        // Update quantity to 4
        CartItemUpdateRequestDto updateReq = new CartItemUpdateRequestDto(4);
        mockMvc.perform(put("/api/cart/items/" + itemId)
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems", is(4)))
                .andExpect(jsonPath("$.data.items[0].quantity", is(4)))
                .andExpect(jsonPath("$.data.subtotal", is(400.00)));
    }

    @Test
    @DisplayName("PUT /api/cart/items/{id} rejects quantity exceeding stock")
    void testUpdateCartItemQuantityExceedsStock() throws Exception {
        CartItemRequestDto addReq = new CartItemRequestDto(lowStockProduct.getId(), 1);
        MvcResult addResult = mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Number itemId = com.jayway.jsonpath.JsonPath.read(addResult.getResponse().getContentAsString(), "$.data.items[0].id");

        // Update to 10 (only 2 in stock)
        CartItemUpdateRequestDto updateReq = new CartItemUpdateRequestDto(10);
        mockMvc.perform(put("/api/cart/items/" + itemId)
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("exceeds available stock")));
    }

    @Test
    @DisplayName("DELETE /api/cart/items/{id} removes specific item")
    void testRemoveCartItem() throws Exception {
        CartItemRequestDto addReq = new CartItemRequestDto(inStockProduct.getId(), 2);
        MvcResult addResult = mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Number itemId = com.jayway.jsonpath.JsonPath.read(addResult.getResponse().getContentAsString(), "$.data.items[0].id");

        mockMvc.perform(delete("/api/cart/items/" + itemId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems", is(0)))
                .andExpect(jsonPath("$.data.items", hasSize(0)));
    }

    @Test
    @DisplayName("DELETE /api/cart clears all items from cart")
    void testClearCart() throws Exception {
        // Add two different products
        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CartItemRequestDto(inStockProduct.getId(), 2))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CartItemRequestDto(lowStockProduct.getId(), 1))))
                .andExpect(status().isCreated());

        // Clear cart
        mockMvc.perform(delete("/api/cart")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems", is(0)))
                .andExpect(jsonPath("$.data.items", hasSize(0)))
                .andExpect(jsonPath("$.data.subtotal", is(0)));
    }
}
