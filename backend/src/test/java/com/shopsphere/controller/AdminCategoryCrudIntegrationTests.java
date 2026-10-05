package com.shopsphere.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.dto.request.CategoryRequestDto;
import com.shopsphere.dto.request.LoginRequestDto;
import com.shopsphere.dto.response.ApiResponse;
import com.shopsphere.dto.response.AuthResponseDto;
import com.shopsphere.entity.Category;
import com.shopsphere.repository.CategoryRepository;
import com.shopsphere.repository.ProductRepository;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminCategoryCrudIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    private String adminToken;
    private String customerToken;

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
    }

    @Test
    @DisplayName("GET /api/categories - public access returns 200 with product count")
    void testGetAllCategoriesPublic() throws Exception {
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", not(empty())))
                .andExpect(jsonPath("$.data[0].id").exists())
                .andExpect(jsonPath("$.data[0].name").exists())
                .andExpect(jsonPath("$.data[0].productCount").isNumber());
    }

    @Test
    @DisplayName("POST /api/categories - customer is rejected with 403")
    void testCreateCategoryAsCustomerRejected() throws Exception {
        CategoryRequestDto request = new CategoryRequestDto("Forbidden Cat", "forbidden-cat", "🚫", "Should fail");

        mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/categories - unauthenticated is rejected with 401")
    void testCreateCategoryUnauthenticatedRejected() throws Exception {
        CategoryRequestDto request = new CategoryRequestDto("Anon Cat", "anon-cat", "❓", "Should fail");

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/categories - admin successfully creates new category")
    void testCreateCategoryAsAdmin() throws Exception {
        String uniqueName = "Test Cat " + System.currentTimeMillis();
        CategoryRequestDto request = new CategoryRequestDto(uniqueName, "", "🎮", "Gaming peripherals and accessories");

        mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").exists())
                .andExpect(jsonPath("$.data.name").value(uniqueName))
                .andExpect(jsonPath("$.data.slug").isNotEmpty())
                .andExpect(jsonPath("$.data.productCount").value(0));
    }

    @Test
    @DisplayName("PUT /api/categories/{id} - admin updates category details")
    void testUpdateCategoryAsAdmin() throws Exception {
        Category category = new Category("Update Test " + System.currentTimeMillis(), "upd-test-" + System.currentTimeMillis(), "⚙️", "Original desc");
        category = categoryRepository.save(category);

        CategoryRequestDto updateDto = new CategoryRequestDto("Updated Name " + System.currentTimeMillis(), category.getSlug(), "✨", "Updated desc");

        mockMvc.perform(put("/api/categories/" + category.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value(updateDto.getName()))
                .andExpect(jsonPath("$.data.icon").value("✨"))
                .andExpect(jsonPath("$.data.description").value("Updated desc"));
    }

    @Test
    @DisplayName("DELETE /api/categories/{id} - prevents invalid deletion when category has products")
    void testDeleteCategoryWithProductsRejected() throws Exception {
        // Find a category that currently has products
        Category categoryWithProducts = categoryRepository.findAll().stream()
                .filter(c -> productRepository.countByCategoryId(c.getId()) > 0)
                .findFirst()
                .orElseThrow();

        mockMvc.perform(delete("/api/categories/" + categoryWithProducts.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message", containsString("Cannot delete category")));
    }

    @Test
    @DisplayName("DELETE /api/categories/{id} - deletes category with 0 products successfully")
    void testDeleteEmptyCategoryAsAdmin() throws Exception {
        Category emptyCategory = new Category("Empty Cat " + System.currentTimeMillis(), "empty-cat-" + System.currentTimeMillis(), "🗑️", "No products");
        emptyCategory = categoryRepository.save(emptyCategory);

        mockMvc.perform(delete("/api/categories/" + emptyCategory.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/categories/" + emptyCategory.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /api/categories/{id} - customer cannot delete category (403)")
    void testDeleteCategoryAsCustomerForbidden() throws Exception {
        Category emptyCategory = new Category("Cust Del Test " + System.currentTimeMillis(), "cust-del-test-" + System.currentTimeMillis(), "🔒", "Test");
        emptyCategory = categoryRepository.save(emptyCategory);

        mockMvc.perform(delete("/api/categories/" + emptyCategory.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }
}
