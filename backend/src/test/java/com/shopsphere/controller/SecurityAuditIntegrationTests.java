package com.shopsphere.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.dto.request.CartItemRequestDto;
import com.shopsphere.dto.request.LoginRequestDto;
import com.shopsphere.dto.request.OrderCreateRequestDto;
import com.shopsphere.dto.request.PriceUpdateRequestDto;
import com.shopsphere.dto.request.RegisterRequestDto;
import com.shopsphere.dto.request.StockUpdateRequestDto;
import com.shopsphere.dto.response.ApiResponse;
import com.shopsphere.dto.response.AuthResponseDto;
import com.shopsphere.entity.Category;
import com.shopsphere.entity.Product;
import com.shopsphere.entity.User;
import com.shopsphere.entity.enums.Role;
import com.shopsphere.repository.CategoryRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.repository.UserRepository;
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

import java.math.BigDecimal;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SecurityAuditIntegrationTests {

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
    private PasswordEncoder passwordEncoder;

    private String adminToken;
    private String customerAToken;
    private String customerBToken;
    private Product testProduct;

    @BeforeEach
    void setUp() throws Exception {
        // Admin token
        LoginRequestDto adminLogin = new LoginRequestDto("admin@shopsphere.com", "Admin@123456");
        MvcResult adminRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        ApiResponse<?> adminApi = objectMapper.readValue(adminRes.getResponse().getContentAsString(), ApiResponse.class);
        adminToken = objectMapper.convertValue(adminApi.getData(), AuthResponseDto.class).getToken();

        // Customer A registration / login
        String emailA = "customer.a." + System.currentTimeMillis() + "@example.com";
        RegisterRequestDto regA = new RegisterRequestDto("Customer A", emailA, "Password@123", "9876543210");
        MvcResult resA = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regA)))
                .andExpect(status().isCreated())
                .andReturn();
        ApiResponse<?> apiA = objectMapper.readValue(resA.getResponse().getContentAsString(), ApiResponse.class);
        customerAToken = objectMapper.convertValue(apiA.getData(), AuthResponseDto.class).getToken();

        // Customer B registration / login
        String emailB = "customer.b." + System.currentTimeMillis() + "@example.com";
        RegisterRequestDto regB = new RegisterRequestDto("Customer B", emailB, "Password@123", "9123456780");
        MvcResult resB = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regB)))
                .andExpect(status().isCreated())
                .andReturn();
        ApiResponse<?> apiB = objectMapper.readValue(resB.getResponse().getContentAsString(), ApiResponse.class);
        customerBToken = objectMapper.convertValue(apiB.getData(), AuthResponseDto.class).getToken();

        // Test category & product
        Category cat = categoryRepository.findBySlug("electronics").orElseGet(() ->
                categoryRepository.save(new Category("Electronics", "electronics", "💻", "Electronics category"))
        );
        testProduct = new Product("Security Test Item", "SecBrand", new BigDecimal("199.99"), 25, cat);
        testProduct.setOriginalPrice(new BigDecimal("299.99"));
        testProduct.setActive(true);
        testProduct = productRepository.save(testProduct);
    }

    // -------------------------------------------------------------
    // 1. IDOR Tests: Customer cannot access another customer's order
    // -------------------------------------------------------------

    @Test
    @DisplayName("IDOR: Customer B cannot view Customer A's order details (403 Forbidden)")
    void testCustomerCannotAccessAnotherCustomerOrder() throws Exception {
        // Customer A places an order
        CartItemRequestDto cartReq = new CartItemRequestDto(testProduct.getId(), 2);
        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cartReq)))
                .andExpect(status().isCreated());

        OrderCreateRequestDto orderReq = new OrderCreateRequestDto(
                "Customer A", "9876543210", "123 Marine Drive", "Mumbai", "Maharashtra", "400001"
        );
        MvcResult orderRes = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Long orderId = objectMapper.readTree(orderRes.getResponse().getContentAsString()).get("data").get("id").asLong();

        // Customer A can view their own order
        mockMvc.perform(get("/api/orders/" + orderId)
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isOk());

        // Customer B cannot view Customer A's order (IDOR attempt blocked)
        mockMvc.perform(get("/api/orders/" + orderId)
                        .header("Authorization", "Bearer " + customerBToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("IDOR: Customer B cannot view Customer A's order tracking (403 Forbidden)")
    void testCustomerCannotTrackAnotherCustomerOrder() throws Exception {
        // Customer A places an order
        CartItemRequestDto cartReq = new CartItemRequestDto(testProduct.getId(), 1);
        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cartReq)))
                .andExpect(status().isCreated());

        OrderCreateRequestDto orderReq = new OrderCreateRequestDto(
                "Customer A", "9876543210", "123 Marine Drive", "Mumbai", "Maharashtra", "400001"
        );
        MvcResult orderRes = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Long orderId = objectMapper.readTree(orderRes.getResponse().getContentAsString()).get("data").get("id").asLong();

        // Customer B attempts tracking -> blocked
        mockMvc.perform(get("/api/orders/" + orderId + "/tracking")
                        .header("Authorization", "Bearer " + customerBToken))
                .andExpect(status().isForbidden());
    }

    // -------------------------------------------------------------
    // 2. Authorization: Customer cannot access admin APIs
    // -------------------------------------------------------------

    @Test
    @DisplayName("Customer cannot access Admin Dashboard (403 Forbidden)")
    void testCustomerCannotAccessAdminDashboard() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Customer cannot access Admin Inventory (403 Forbidden)")
    void testCustomerCannotAccessAdminInventory() throws Exception {
        mockMvc.perform(get("/api/admin/inventory")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Customer cannot access Admin Orders (403 Forbidden)")
    void testCustomerCannotAccessAdminOrders() throws Exception {
        mockMvc.perform(get("/api/admin/orders")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isForbidden());
    }

    // -------------------------------------------------------------
    // 3. Price & Stock Tampering Prevention
    // -------------------------------------------------------------

    @Test
    @DisplayName("Customer cannot manipulate product stock directly (403 Forbidden)")
    void testCustomerCannotManipulateStock() throws Exception {
        StockUpdateRequestDto req = new StockUpdateRequestDto(999);
        mockMvc.perform(patch("/api/products/" + testProduct.getId() + "/stock")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Customer cannot manipulate product price directly (403 Forbidden)")
    void testCustomerCannotManipulatePrice() throws Exception {
        PriceUpdateRequestDto req = new PriceUpdateRequestDto(new BigDecimal("1.00"), new BigDecimal("1.00"));
        mockMvc.perform(patch("/api/products/" + testProduct.getId() + "/price")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Order creation ignores arbitrary client price; recalculates from DB")
    void testOrderCreationRecalculatesPriceFromServer() throws Exception {
        // Customer adds item to cart (CartItemRequestDto has NO price parameter)
        CartItemRequestDto cartReq = new CartItemRequestDto(testProduct.getId(), 2);
        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cartReq)))
                .andExpect(status().isCreated());

        // Place order with arbitrary body attempt (attacker attempts to set price, subtotal, and totalAmount to 1.00)
        String payloadWithFakePrice = """
                {
                    "fullName": "Customer A",
                    "phone": "9876543210",
                    "address": "123 Marine Drive",
                    "city": "Mumbai",
                    "state": "Maharashtra",
                    "postalCode": "400001",
                    "totalAmount": 1.00,
                    "subtotal": 1.00,
                    "price": 1.00
                }
                """;

        MvcResult orderRes = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadWithFakePrice))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode data = objectMapper.readTree(orderRes.getResponse().getContentAsString()).get("data");
        BigDecimal expectedSubtotal = testProduct.getPrice().multiply(BigDecimal.valueOf(2)); // 199.99 * 2 = 399.98
        BigDecimal returnedSubtotal = new BigDecimal(data.get("subtotal").asText());

        // Assert subtotal matches server product price, not arbitrary client price 1.00
        org.junit.jupiter.api.Assertions.assertEquals(0, expectedSubtotal.compareTo(returnedSubtotal));
    }

    // -------------------------------------------------------------
    // 4. Sensitive Data Exposure: Password hashes & secrets
    // -------------------------------------------------------------

    @Test
    @DisplayName("User entity Jackson serialization never includes password hash")
    void testUserEntityJacksonSerializationOmitsPassword() throws Exception {
        User user = new User("Test User", "test.user@example.com", passwordEncoder.encode("SecretPass123"), Role.CUSTOMER);
        String json = objectMapper.writeValueAsString(user);

        assertFalse(json.contains("password"), "User JSON serialization must not contain 'password'");
        assertFalse(json.contains("SecretPass123"), "User JSON serialization must not contain plaintext password");
    }

    @Test
    @DisplayName("User profile endpoint never returns password hash")
    void testProfileEndpointOmitsPassword() throws Exception {
        MvcResult res = mockMvc.perform(get("/api/users/profile")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isOk())
                .andReturn();

        String body = res.getResponse().getContentAsString();
        assertFalse(body.contains("password"), "Profile response must never return password or password hash");
    }

    @Test
    @DisplayName("Tampered JWT token returns 401 Unauthorized")
    void testTamperedJwtReturns401() throws Exception {
        String tamperedToken = customerAToken + "tampered";
        mockMvc.perform(get("/api/users/profile")
                        .header("Authorization", "Bearer " + tamperedToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Missing authentication token returns 401 Unauthorized")
    void testMissingAuthReturns401() throws Exception {
        mockMvc.perform(get("/api/users/profile"))
                .andExpect(status().isUnauthorized());
    }
}