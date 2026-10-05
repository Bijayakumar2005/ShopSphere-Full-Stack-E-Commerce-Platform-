package com.shopsphere.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.dto.request.LoginRequestDto;
import com.shopsphere.dto.response.ApiResponse;
import com.shopsphere.dto.response.AuthResponseDto;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminControllerIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String customerToken;

    @BeforeEach
    void setUp() throws Exception {
        // Login as default admin
        LoginRequestDto adminLogin = new LoginRequestDto("admin@shopsphere.com", "Admin@123456");
        MvcResult adminRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        ApiResponse<?> adminApiRes = objectMapper.readValue(adminRes.getResponse().getContentAsString(), ApiResponse.class);
        AuthResponseDto adminAuth = objectMapper.convertValue(adminApiRes.getData(), AuthResponseDto.class);
        adminToken = adminAuth.getToken();

        // Login as default customer
        LoginRequestDto customerLogin = new LoginRequestDto("customer@shopsphere.com", "Customer@123456");
        MvcResult custRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(customerLogin)))
                .andExpect(status().isOk())
                .andReturn();
        ApiResponse<?> custApiRes = objectMapper.readValue(custRes.getResponse().getContentAsString(), ApiResponse.class);
        AuthResponseDto custAuth = objectMapper.convertValue(custApiRes.getData(), AuthResponseDto.class);
        customerToken = custAuth.getToken();
    }

    @Test
    @DisplayName("Admin can retrieve dashboard statistics")
    void testGetAdminDashboardStatsAsAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalProducts").isNumber())
                .andExpect(jsonPath("$.data.totalCustomers").isNumber())
                .andExpect(jsonPath("$.data.totalOrders").isNumber())
                .andExpect(jsonPath("$.data.pendingOrders").isNumber())
                .andExpect(jsonPath("$.data.deliveredOrders").isNumber())
                .andExpect(jsonPath("$.data.lowStockProducts").isNumber())
                .andExpect(jsonPath("$.data.orderStatusDistribution").isMap())
                .andExpect(jsonPath("$.data.recentOrders").isArray())
                .andExpect(jsonPath("$.data.lowStockList").isArray());
    }

    @Test
    @DisplayName("Customer cannot access admin dashboard (403 Forbidden)")
    void testCustomerCannotAccessAdminDashboard() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin can retrieve inventory with pagination and search")
    void testGetAdminInventory() throws Exception {
        mockMvc.perform(get("/api/admin/inventory")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "0")
                        .param("size", "10")
                        .param("stockStatus", "IN_STOCK"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.totalElements").isNumber());
    }

    @Test
    @DisplayName("Admin can retrieve inventory statistics")
    void testGetAdminInventoryStats() throws Exception {
        mockMvc.perform(get("/api/admin/inventory/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalProducts").isNumber())
                .andExpect(jsonPath("$.data.inStock").isNumber())
                .andExpect(jsonPath("$.data.lowStock").isNumber())
                .andExpect(jsonPath("$.data.outOfStock").isNumber());
    }

    @Test
    @DisplayName("Malformed request body returns 400 Bad Request instead of 500")
    void testMalformedRequestBodyReturns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"invalid-json-without-closing-bracket\""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    @Test
    @DisplayName("Invalid enum value in request body returns 400 Bad Request")
    void testInvalidEnumReturns400() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/admin/orders/1/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"NON_EXISTENT_STATUS\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }
}
