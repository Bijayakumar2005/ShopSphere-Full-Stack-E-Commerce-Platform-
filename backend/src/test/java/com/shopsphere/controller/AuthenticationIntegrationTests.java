package com.shopsphere.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.dto.request.ChangePasswordRequestDto;
import com.shopsphere.dto.request.LoginRequestDto;
import com.shopsphere.dto.request.RegisterRequestDto;
import com.shopsphere.dto.request.UpdateProfileRequestDto;
import com.shopsphere.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthenticationIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("1. Successful customer registration returns 201 Created and JWT token")
    void testSuccessfulRegistration() throws Exception {
        RegisterRequestDto dto = new RegisterRequestDto(
                "Aarav Sharma",
                "aarav.sharma@example.com",
                "SecurePassword123",
                "+91 98765 12345"
        );

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value("aarav.sharma@example.com"))
                .andExpect(jsonPath("$.data.user.role").value("CUSTOMER"))
                .andReturn();

        // Verify password is never returned
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        assertFalse(root.get("data").get("user").has("password"));

        // Verify in database that password was hashed with BCrypt
        var saved = userRepository.findByEmail("aarav.sharma@example.com").orElseThrow();
        assertNotEquals("SecurePassword123", saved.getPassword());
        assertTrue(saved.getPassword().startsWith("$2a$") || saved.getPassword().startsWith("$2b$"));
    }

    @Test
    @DisplayName("2. Duplicate registration returns 400 Bad Request with ApiErrorResponse")
    void testDuplicateRegistration() throws Exception {
        RegisterRequestDto first = new RegisterRequestDto("First User", "duplicate@example.com", "Password123", null);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated());

        RegisterRequestDto duplicate = new RegisterRequestDto("Second User", "duplicate@example.com", "Password456", null);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicate)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("An account with email duplicate@example.com already exists"));
    }

    @Test
    @DisplayName("3. Successful login returns 200 OK and JWT token")
    void testSuccessfulLogin() throws Exception {
        RegisterRequestDto reg = new RegisterRequestDto("Login User", "loginuser@example.com", "ValidPass123", null);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated());

        LoginRequestDto login = new LoginRequestDto("loginuser@example.com", "ValidPass123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value("loginuser@example.com"));
    }

    @Test
    @DisplayName("4. Login with invalid credentials returns 401 Unauthorized")
    void testInvalidLoginCredentials() throws Exception {
        LoginRequestDto login = new LoginRequestDto("nonexistent@example.com", "WrongPassword123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("5. Customer accessing admin-only endpoint returns 403 Forbidden")
    void testCustomerAccessingAdminEndpoint() throws Exception {
        RegisterRequestDto reg = new RegisterRequestDto("Customer User", "cust@example.com", "Pass123456", null);
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode regJson = objectMapper.readTree(regResult.getResponse().getContentAsString());
        String customerToken = regJson.get("data").get("token").asText();

        // Customer attempts to access /api/admin/dashboard
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("6. Admin accessing admin-only endpoint returns 200 OK")
    void testAdminAccessingAdminEndpoint() throws Exception {
        // Seeded admin
        LoginRequestDto adminLogin = new LoginRequestDto("admin@shopsphere.com", "Admin@123456");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String adminToken = loginJson.get("data").get("token").asText();

        // Admin accesses /api/admin/dashboard
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.role").value("ADMIN"))
                .andExpect(jsonPath("$.data.access").value("GRANTED"));
    }

    @Test
    @DisplayName("7. Customer profile retrieval and update with JWT Bearer token")
    void testProfileFlow() throws Exception {
        RegisterRequestDto reg = new RegisterRequestDto("Initial Name", "profile.test@example.com", "Pass123456", "+91 11111 22222");
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn();

        String token = objectMapper.readTree(regResult.getResponse().getContentAsString())
                .get("data").get("token").asText();

        // GET Profile
        mockMvc.perform(get("/api/users/profile")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Initial Name"))
                .andExpect(jsonPath("$.data.email").value("profile.test@example.com"));

        // UPDATE Profile
        UpdateProfileRequestDto updateDto = new UpdateProfileRequestDto("Updated Full Name", "+91 99999 88888");
        mockMvc.perform(put("/api/users/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Updated Full Name"))
                .andExpect(jsonPath("$.data.phone").value("+91 99999 88888"));
    }

    @Test
    @DisplayName("8. Password change flow with valid and invalid current password")
    void testChangePasswordFlow() throws Exception {
        RegisterRequestDto reg = new RegisterRequestDto("Password User", "pwd.test@example.com", "OldPassword123", null);
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn();

        String token = objectMapper.readTree(regResult.getResponse().getContentAsString())
                .get("data").get("token").asText();

        // Change password with wrong current password -> 400
        ChangePasswordRequestDto wrongOld = new ChangePasswordRequestDto("WrongCurrentPass", "NewPassword123");
        mockMvc.perform(put("/api/users/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongOld)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("The current password provided is incorrect"));

        // Change password with correct current password -> 200 OK
        ChangePasswordRequestDto correctOld = new ChangePasswordRequestDto("OldPassword123", "BrandNewPass123");
        mockMvc.perform(put("/api/users/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(correctOld)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed successfully"));

        // Login with new password -> 200 OK
        LoginRequestDto newLogin = new LoginRequestDto("pwd.test@example.com", "BrandNewPass123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isNotEmpty());
    }
}
