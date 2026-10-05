package com.shopsphere.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.dto.request.ProductCreateRequestDto;
import com.shopsphere.dto.request.ProductUpdateRequestDto;
import com.shopsphere.entity.Category;
import com.shopsphere.entity.Product;
import com.shopsphere.repository.CategoryRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class ProductControllerIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private JwtService jwtService;

    private String adminToken;
    private String customerToken;
    private Category testCategory;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        java.util.Map<String, Object> adminClaims = new java.util.HashMap<>();
        adminClaims.put("userId", 1L);
        adminClaims.put("role", "ADMIN");
        adminToken = jwtService.generateToken(
                adminClaims,
                org.springframework.security.core.userdetails.User
                        .withUsername("admin@shopsphere.com")
                        .password("dummy")
                        .authorities("ROLE_ADMIN")
                        .build()
        );

        java.util.Map<String, Object> custClaims = new java.util.HashMap<>();
        custClaims.put("userId", 2L);
        custClaims.put("role", "CUSTOMER");
        customerToken = jwtService.generateToken(
                custClaims,
                org.springframework.security.core.userdetails.User
                        .withUsername("customer@shopsphere.com")
                        .password("dummy")
                        .authorities("ROLE_CUSTOMER")
                        .build()
        );

        testCategory = categoryRepository.save(new Category(
                "Test Category " + System.currentTimeMillis(),
                "test-cat-" + System.currentTimeMillis(),
                "📦",
                "Category for testing"
        ));

        testProduct = new Product(
                "Integration Test Keyboard",
                "KeyMaster",
                new BigDecimal("99.99"),
                20,
                testCategory
        );
        testProduct.setDescription("Mechanical RGB Keyboard");
        testProduct.setOriginalPrice(new BigDecimal("129.99"));
        testProduct.setActive(true);
        testProduct = productRepository.save(testProduct);
    }

    @Test
    @DisplayName("GET /api/products - Public user can list products with pagination")
    void testGetProducts_PublicSuccess() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.totalElements").isNumber())
                .andExpect(jsonPath("$.data.content[0].name").exists())
                .andExpect(jsonPath("$.data.content[0].price").exists())
                .andExpect(jsonPath("$.data.content[0].stock").exists());
    }

    @Test
    @DisplayName("GET /api/products/{id} - Public user can fetch single product by id")
    void testGetProductById_PublicSuccess() throws Exception {
        mockMvc.perform(get("/api/products/" + testProduct.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(testProduct.getId()))
                .andExpect(jsonPath("$.data.name").value("Integration Test Keyboard"))
                .andExpect(jsonPath("$.data.brand").value("KeyMaster"))
                .andExpect(jsonPath("$.data.price").value(99.99))
                .andExpect(jsonPath("$.data.discount").value(23))
                .andExpect(jsonPath("$.data.stock").value(20))
                .andExpect(jsonPath("$.data.category.name").value(testCategory.getName()));
    }

    @Test
    @DisplayName("GET /api/products/{id} - Non-existent ID returns 404")
    void testGetProductById_NotFound() throws Exception {
        mockMvc.perform(get("/api/products/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("POST /api/products - Anonymous user receives 401 Unauthorized")
    void testCreateProduct_Anonymous_Unauthorized() throws Exception {
        ProductCreateRequestDto dto = new ProductCreateRequestDto();
        dto.setName("Anon Product");
        dto.setBrand("Anon Brand");
        dto.setPrice(new BigDecimal("49.99"));
        dto.setStockQuantity(10);
        dto.setCategoryId(testCategory.getId());

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/products - Customer role receives 403 Forbidden")
    void testCreateProduct_Customer_Forbidden() throws Exception {
        ProductCreateRequestDto dto = new ProductCreateRequestDto();
        dto.setName("Customer Created Product");
        dto.setBrand("Forbidden Brand");
        dto.setPrice(new BigDecimal("49.99"));
        dto.setStockQuantity(10);
        dto.setCategoryId(testCategory.getId());

        mockMvc.perform(post("/api/products")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/products - Admin creates product successfully returns 201")
    void testCreateProduct_Admin_Success() throws Exception {
        ProductCreateRequestDto dto = new ProductCreateRequestDto();
        dto.setName("Pro Ergonomic Mouse");
        dto.setBrand("LogiPro");
        dto.setDescription("High precision wireless trackball");
        dto.setPrice(new BigDecimal("79.99"));
        dto.setOriginalPrice(new BigDecimal("99.99"));
        dto.setStockQuantity(50);
        dto.setCategoryId(testCategory.getId());
        dto.setImageUrl("https://example.com/mouse.jpg");
        dto.setEmoji("🖱️");

        mockMvc.perform(post("/api/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").isNumber())
                .andExpect(jsonPath("$.data.name").value("Pro Ergonomic Mouse"))
                .andExpect(jsonPath("$.data.price").value(79.99))
                .andExpect(jsonPath("$.data.stock").value(50))
                .andExpect(jsonPath("$.data.category.id").value(testCategory.getId()));
    }

    @Test
    @DisplayName("POST /api/products - Validation failure returns 400 Bad Request")
    void testCreateProduct_ValidationFailure() throws Exception {
        ProductCreateRequestDto dto = new ProductCreateRequestDto();
        // Missing name, brand, price, stockQuantity, categoryId

        mockMvc.perform(post("/api/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("PUT /api/products/{id} - Admin updates product successfully")
    void testUpdateProduct_Admin_Success() throws Exception {
        ProductUpdateRequestDto dto = new ProductUpdateRequestDto();
        dto.setName("Updated Test Keyboard v2");
        dto.setPrice(new BigDecimal("119.99"));
        dto.setStockQuantity(35);

        mockMvc.perform(put("/api/products/" + testProduct.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Updated Test Keyboard v2"))
                .andExpect(jsonPath("$.data.price").value(119.99))
                .andExpect(jsonPath("$.data.stock").value(35));
    }

    @Test
    @DisplayName("DELETE /api/products/{id} - Customer receives 403 Forbidden")
    void testDeleteProduct_Customer_Forbidden() throws Exception {
        mockMvc.perform(delete("/api/products/" + testProduct.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DELETE /api/products/{id} - Admin deletes product successfully")
    void testDeleteProduct_Admin_Success() throws Exception {
        mockMvc.perform(delete("/api/products/" + testProduct.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Product deleted successfully"));

        // Confirm product is deactivated and cannot be retrieved through GET
        mockMvc.perform(get("/api/products/" + testProduct.getId()))
                .andExpect(status().isNotFound());
    }
}
