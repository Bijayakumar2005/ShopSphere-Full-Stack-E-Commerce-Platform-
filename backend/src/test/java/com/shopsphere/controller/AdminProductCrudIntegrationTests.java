package com.shopsphere.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.dto.request.LoginRequestDto;
import com.shopsphere.dto.request.PriceUpdateRequestDto;
import com.shopsphere.dto.request.ProductCreateRequestDto;
import com.shopsphere.dto.request.ProductUpdateRequestDto;
import com.shopsphere.dto.request.StockUpdateRequestDto;
import com.shopsphere.dto.response.ApiResponse;
import com.shopsphere.dto.response.AuthResponseDto;
import com.shopsphere.entity.Category;
import com.shopsphere.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminProductCrudIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CategoryRepository categoryRepository;

    private String adminToken;
    private String customerToken;
    private Long categoryId;

    @BeforeEach
    void setUp() throws Exception {
        // Login as admin
        LoginRequestDto adminLogin = new LoginRequestDto("admin@shopsphere.com", "Admin@123456");
        MvcResult adminRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        ApiResponse<?> adminApi = objectMapper.readValue(adminRes.getResponse().getContentAsString(), ApiResponse.class);
        AuthResponseDto adminAuth = objectMapper.convertValue(adminApi.getData(), AuthResponseDto.class);
        adminToken = adminAuth.getToken();

        // Login as customer
        LoginRequestDto customerLogin = new LoginRequestDto("customer@shopsphere.com", "Customer@123456");
        MvcResult custRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(customerLogin)))
                .andExpect(status().isOk())
                .andReturn();
        ApiResponse<?> custApi = objectMapper.readValue(custRes.getResponse().getContentAsString(), ApiResponse.class);
        AuthResponseDto custAuth = objectMapper.convertValue(custApi.getData(), AuthResponseDto.class);
        customerToken = custAuth.getToken();

        Category category = categoryRepository.findAll().stream().findFirst().orElseGet(() -> {
            Category cat = new Category("Electronics", "electronics", "⚡", "All electronic gadgets");
            return categoryRepository.save(cat);
        });
        categoryId = category.getId();
    }

    @Test
    @DisplayName("Admin can perform full Product CRUD operations")
    void testAdminProductCrudFlow() throws Exception {
        // 1. Create Product
        ProductCreateRequestDto createReq = new ProductCreateRequestDto();
        createReq.setName("Pro Test Noise Cancelling Earbuds");
        createReq.setBrand("SoundPro");
        createReq.setDescription("High fidelity wireless sound");
        createReq.setPrice(new BigDecimal("4999.00"));
        createReq.setDiscount(20);
        createReq.setStockQuantity(50);
        createReq.setCategoryId(categoryId);
        createReq.setImageUrl("https://images.unsplash.com/photo-1590658268037-6bf12165a8df");

        MvcResult createResult = mockMvc.perform(post("/api/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Pro Test Noise Cancelling Earbuds"))
                .andExpect(jsonPath("$.data.stockQuantity").value(50))
                .andReturn();

        ApiResponse<?> createApi = objectMapper.readValue(createResult.getResponse().getContentAsString(), ApiResponse.class);
        Number prodIdNum = (Number) ((java.util.Map<?, ?>) createApi.getData()).get("id");
        Long productId = prodIdNum.longValue();

        // 2. Quick Stock Update
        StockUpdateRequestDto stockReq = new StockUpdateRequestDto(75);
        mockMvc.perform(patch("/api/products/" + productId + "/stock")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(stockReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stockQuantity").value(75));

        // 3. Quick Price Update
        PriceUpdateRequestDto priceReq = new PriceUpdateRequestDto(new BigDecimal("4599.00"), new BigDecimal("5999.00"));
        mockMvc.perform(patch("/api/products/" + productId + "/price")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(priceReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.price").value(4599.0));

        // 4. Full Update Product
        ProductUpdateRequestDto updateReq = new ProductUpdateRequestDto();
        updateReq.setName("Pro Test Noise Cancelling Earbuds V2");
        updateReq.setBrand("SoundPro Max");
        updateReq.setPrice(new BigDecimal("4299.00"));
        updateReq.setStockQuantity(100);

        mockMvc.perform(put("/api/products/" + productId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Pro Test Noise Cancelling Earbuds V2"))
                .andExpect(jsonPath("$.data.brand").value("SoundPro Max"));

        // 5. Delete Product (Soft delete)
        mockMvc.perform(delete("/api/products/" + productId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("Customer cannot access Admin Product Management endpoints (403 Forbidden)")
    void testCustomerCannotAccessAdminEndpoints() throws Exception {
        ProductCreateRequestDto createReq = new ProductCreateRequestDto();
        createReq.setName("Hacker Product");
        createReq.setBrand("Hacker");
        createReq.setPrice(new BigDecimal("10.00"));
        createReq.setStockQuantity(10);
        createReq.setCategoryId(categoryId);

        // POST /api/products as customer
        mockMvc.perform(post("/api/products")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isForbidden());

        // PUT /api/products/1 as customer
        mockMvc.perform(put("/api/products/1")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isForbidden());

        // PATCH /api/products/1/stock as customer
        mockMvc.perform(patch("/api/products/1/stock")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new StockUpdateRequestDto(100))))
                .andExpect(status().isForbidden());

        // DELETE /api/products/1 as customer
        mockMvc.perform(delete("/api/products/1")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Categories endpoint returns all categories")
    void testGetCategories() throws Exception {
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }
}
