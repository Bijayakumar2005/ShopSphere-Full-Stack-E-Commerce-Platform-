package com.shopsphere.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.dto.request.CartItemRequestDto;
import com.shopsphere.dto.request.OrderCreateRequestDto;
import com.shopsphere.entity.Category;
import com.shopsphere.entity.Product;
import com.shopsphere.entity.User;
import com.shopsphere.entity.enums.OrderStatus;
import com.shopsphere.entity.enums.PaymentStatus;
import com.shopsphere.entity.enums.Role;
import com.shopsphere.repository.*;
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
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class OrderControllerIntegrationTests {

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
    private CartRepository cartRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String customerToken;
    private String otherCustomerToken;
    private String adminToken;
    private User testCustomer;
    private User otherCustomer;
    private User testAdmin;
    private Product product1;
    private Product product2;

    @BeforeEach
    void setUp() {
        // Create main test customer
        testCustomer = new User();
        testCustomer.setName("Order Buyer");
        testCustomer.setEmail("orderbuyer@shopsphere.com");
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

        // Create second test customer
        otherCustomer = new User();
        otherCustomer.setName("Other Customer");
        otherCustomer.setEmail("othercustomer@shopsphere.com");
        otherCustomer.setPassword(passwordEncoder.encode("Password@123"));
        otherCustomer.setRole(Role.CUSTOMER);
        otherCustomer.setActive(true);
        otherCustomer = userRepository.save(otherCustomer);

        Map<String, Object> otherClaims = new HashMap<>();
        otherClaims.put("userId", otherCustomer.getId());
        otherClaims.put("role", "CUSTOMER");
        otherCustomerToken = jwtService.generateToken(
                otherClaims,
                org.springframework.security.core.userdetails.User
                        .withUsername(otherCustomer.getEmail())
                        .password("dummy")
                        .authorities("ROLE_CUSTOMER")
                        .build()
        );

        // Create test admin
        testAdmin = new User();
        testAdmin.setName("Test Admin");
        testAdmin.setEmail("adminuser@shopsphere.com");
        testAdmin.setPassword(passwordEncoder.encode("Password@123"));
        testAdmin.setRole(Role.ADMIN);
        testAdmin.setActive(true);
        testAdmin = userRepository.save(testAdmin);

        Map<String, Object> adminClaims = new HashMap<>();
        adminClaims.put("userId", testAdmin.getId());
        adminClaims.put("role", "ADMIN");
        adminToken = jwtService.generateToken(
                adminClaims,
                org.springframework.security.core.userdetails.User
                        .withUsername(testAdmin.getEmail())
                        .password("dummy")
                        .authorities("ROLE_ADMIN")
                        .build()
        );

        Category category = categoryRepository.save(new Category(
                "Electronics", "electronics", "💻", "Electronics category"
        ));

        product1 = new Product(
                "Mechanical Gaming Keyboard",
                "KeyMaster",
                new BigDecimal("500.00"),
                10,
                category
        );
        product1.setOriginalPrice(new BigDecimal("700.00"));
        product1.setActive(true);
        product1 = productRepository.save(product1);

        product2 = new Product(
                "Wireless Precision Mouse",
                "LogiTech",
                new BigDecimal("600.00"),
                5,
                category
        );
        product2.setOriginalPrice(new BigDecimal("800.00"));
        product2.setActive(true);
        product2 = productRepository.save(product2);
    }

    private void addItemToCart(String token, Long productId, int quantity) throws Exception {
        CartItemRequestDto req = new CartItemRequestDto(productId, quantity);
        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Successfully create order: calculates totals, reduces stock, clears cart, creates Order & OrderItems")
    void testCreateOrderSuccess() throws Exception {
        // Add 2 keyboards (500 each = 1000) and 1 mouse (600) -> subtotal 1600 (>= 999 so shipping is 0, total 1600)
        addItemToCart(customerToken, product1.getId(), 2);
        addItemToCart(customerToken, product2.getId(), 1);

        OrderCreateRequestDto request = new OrderCreateRequestDto(
                "John Doe",
                "9876543210",
                "123 Marine Drive",
                "Mumbai",
                "Maharashtra",
                "400001",
                "CASH_ON_DELIVERY"
        );

        MvcResult result = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.orderNumber", startsWith("ORD-")))
                .andExpect(jsonPath("$.data.orderStatus", is("PLACED")))
                .andExpect(jsonPath("$.data.paymentStatus", is("PENDING")))
                .andExpect(jsonPath("$.data.paymentMethod", is("CASH_ON_DELIVERY")))
                .andExpect(jsonPath("$.data.subtotal", is(1600.00)))
                .andExpect(jsonPath("$.data.shippingFee").value(0))
                .andExpect(jsonPath("$.data.totalAmount", is(1600.00)))
                .andExpect(jsonPath("$.data.totalItems", is(3)))
                .andExpect(jsonPath("$.data.items", hasSize(2)))
                .andReturn();

        // Verify stock was reduced in the database
        Product updatedP1 = productRepository.findById(product1.getId()).orElseThrow();
        assertEquals(8, updatedP1.getStockQuantity()); // 10 - 2 = 8

        Product updatedP2 = productRepository.findById(product2.getId()).orElseThrow();
        assertEquals(4, updatedP2.getStockQuantity()); // 5 - 1 = 4

        // Verify cart is now empty
        mockMvc.perform(get("/api/cart")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", empty()))
                .andExpect(jsonPath("$.data.totalItems", is(0)));
    }

    @Test
    @DisplayName("Create order fails when cart is empty")
    void testCreateOrderEmptyCart() throws Exception {
        OrderCreateRequestDto request = new OrderCreateRequestDto(
                "John Doe",
                "9876543210",
                "123 Marine Drive",
                "Mumbai",
                "Maharashtra",
                "400001"
        );

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("empty cart")));
    }

    @Test
    @DisplayName("Create order fails and rolls back when insufficient stock")
    void testCreateOrderInsufficientStock() throws Exception {
        // Add 5 mice to cart (all available stock)
        addItemToCart(customerToken, product2.getId(), 5);

        // Before checkout, another purchase or admin reduces stock to 3
        product2.setStockQuantity(3);
        productRepository.save(product2);

        OrderCreateRequestDto request = new OrderCreateRequestDto(
                "John Doe",
                "9876543210",
                "123 Marine Drive",
                "Mumbai",
                "Maharashtra",
                "400001"
        );

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Insufficient stock")));

        // Verify stock remains untouched at 3
        Product p2 = productRepository.findById(product2.getId()).orElseThrow();
        assertEquals(3, p2.getStockQuantity());

        // Verify cart is NOT cleared because transaction rolled back
        mockMvc.perform(get("/api/cart")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(1)));
    }

    @Test
    @DisplayName("Create order validates shipping fields and rejects invalid data")
    void testCreateOrderInvalidShippingData() throws Exception {
        addItemToCart(customerToken, product1.getId(), 1);

        // Missing full name, address, etc.
        OrderCreateRequestDto request = new OrderCreateRequestDto();
        request.setCity("Mumbai");

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Authoritative price recalculation: backend ignores frontend prices and uses DB price")
    void testPriceChangeHandledAuthoritativelyByBackend() throws Exception {
        // Add keyboard at 500
        addItemToCart(customerToken, product1.getId(), 1);

        // Before checkout, product price increases to 550 in DB
        product1.setPrice(new BigDecimal("550.00"));
        productRepository.save(product1);

        OrderCreateRequestDto request = new OrderCreateRequestDto(
                "Jane Doe",
                "9876543210",
                "456 Park Avenue",
                "Bangalore",
                "Karnataka",
                "560001"
        );

        // Subtotal should be 550, + 99 shipping (since < 999) = 649.00
        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.subtotal", is(550.00)))
                .andExpect(jsonPath("$.data.shippingFee").value(99))
                .andExpect(jsonPath("$.data.totalAmount", is(649.00)))
                .andExpect(jsonPath("$.data.items[0].price", is(550.00)));
    }

    @Test
    @DisplayName("Get user orders returns paginated list of user's orders")
    void testGetUserOrders() throws Exception {
        addItemToCart(customerToken, product1.getId(), 1);
        OrderCreateRequestDto request = new OrderCreateRequestDto(
                "John Doe", "9876543210", "123 Marine Drive", "Mumbai", "Maharashtra", "400001"
        );
        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.totalElements", is(1)));
    }

    @Test
    @DisplayName("Get order by ID returns specific order details")
    void testGetOrderById() throws Exception {
        addItemToCart(customerToken, product1.getId(), 1);
        OrderCreateRequestDto request = new OrderCreateRequestDto(
                "John Doe", "9876543210", "123 Marine Drive", "Mumbai", "Maharashtra", "400001"
        );
        MvcResult postResult = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String responseJson = postResult.getResponse().getContentAsString();
        Long orderId = objectMapper.readTree(responseJson).get("data").get("id").asLong();
        String orderNumber = objectMapper.readTree(responseJson).get("data").get("orderNumber").asText();

        // Can get by numeric ID
        mockMvc.perform(get("/api/orders/" + orderId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", is(orderId.intValue())))
                .andExpect(jsonPath("$.data.orderNumber", is(orderNumber)));

        // Can also get by orderNumber string
        mockMvc.perform(get("/api/orders/" + orderNumber)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", is(orderId.intValue())));
    }

    @Test
    @DisplayName("User cannot access another user's order")
    void testOrderAccessControl() throws Exception {
        addItemToCart(customerToken, product1.getId(), 1);
        OrderCreateRequestDto request = new OrderCreateRequestDto(
                "John Doe", "9876543210", "123 Marine Drive", "Mumbai", "Maharashtra", "400001"
        );
        MvcResult postResult = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String responseJson = postResult.getResponse().getContentAsString();
        Long orderId = objectMapper.readTree(responseJson).get("data").get("id").asLong();

        // Other customer tries to view this order
        mockMvc.perform(get("/api/orders/" + orderId)
                        .header("Authorization", "Bearer " + otherCustomerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated request to order endpoints is rejected with 401")
    void testUnauthenticatedAccessRejected() throws Exception {
        mockMvc.perform(get("/api/orders"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Get order tracking for newly PLACED order shows PLACED as CURRENT and others as UPCOMING")
    void testGetOrderTrackingPlaced() throws Exception {
        addItemToCart(customerToken, product1.getId(), 1);
        OrderCreateRequestDto request = new OrderCreateRequestDto(
                "John Doe", "9876543210", "123 Marine Drive", "Mumbai", "Maharashtra", "400001"
        );
        MvcResult postResult = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        Long orderId = objectMapper.readTree(postResult.getResponse().getContentAsString()).get("data").get("id").asLong();

        mockMvc.perform(get("/api/orders/" + orderId + "/tracking")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.orderId", is(orderId.intValue())))
                .andExpect(jsonPath("$.data.currentStatus", is("PLACED")))
                .andExpect(jsonPath("$.data.currentStepIndex", is(0)))
                .andExpect(jsonPath("$.data.delivered", is(false)))
                .andExpect(jsonPath("$.data.cancelled", is(false)))
                .andExpect(jsonPath("$.data.timeline", hasSize(5)))
                .andExpect(jsonPath("$.data.timeline[0].status", is("PLACED")))
                .andExpect(jsonPath("$.data.timeline[0].title", is("Order Placed")))
                .andExpect(jsonPath("$.data.timeline[0].state", is("CURRENT")))
                .andExpect(jsonPath("$.data.timeline[1].status", is("CONFIRMED")))
                .andExpect(jsonPath("$.data.timeline[1].state", is("UPCOMING")))
                .andExpect(jsonPath("$.data.timeline[4].status", is("DELIVERED")))
                .andExpect(jsonPath("$.data.timeline[4].state", is("UPCOMING")));
    }

    @Test
    @DisplayName("Order tracking progression: SHIPPED order shows earlier steps as COMPLETED, SHIPPED as CURRENT, DELIVERED as UPCOMING")
    void testGetOrderTrackingProgression() throws Exception {
        addItemToCart(customerToken, product1.getId(), 1);
        OrderCreateRequestDto request = new OrderCreateRequestDto(
                "John Doe", "9876543210", "123 Marine Drive", "Mumbai", "Maharashtra", "400001"
        );
        MvcResult postResult = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        Long orderId = objectMapper.readTree(postResult.getResponse().getContentAsString()).get("data").get("id").asLong();

        // Admin updates status through valid progression: PLACED -> CONFIRMED -> PROCESSING -> SHIPPED
        for (OrderStatus st : java.util.List.of(OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED)) {
            mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new com.shopsphere.dto.request.OrderStatusUpdateRequestDto(st))))
                    .andExpect(status().isOk());
        }


        // Customer tracks order
        mockMvc.perform(get("/api/orders/" + orderId + "/tracking")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentStatus", is("SHIPPED")))
                .andExpect(jsonPath("$.data.currentStepIndex", is(3)))
                .andExpect(jsonPath("$.data.timeline[0].state", is("COMPLETED"))) // ✓ Order Placed
                .andExpect(jsonPath("$.data.timeline[1].state", is("COMPLETED"))) // ✓ Order Confirmed
                .andExpect(jsonPath("$.data.timeline[2].state", is("COMPLETED"))) // ✓ Processing
                .andExpect(jsonPath("$.data.timeline[3].state", is("CURRENT")))   // ● Shipped
                .andExpect(jsonPath("$.data.timeline[4].state", is("UPCOMING"))); // ○ Delivered
    }

    @Test
    @DisplayName("Delivered order marks all 5 steps as COMPLETED")
    void testGetOrderTrackingDelivered() throws Exception {
        addItemToCart(customerToken, product1.getId(), 1);
        OrderCreateRequestDto request = new OrderCreateRequestDto(
                "John Doe", "9876543210", "123 Marine Drive", "Mumbai", "Maharashtra", "400001"
        );
        MvcResult postResult = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        Long orderId = objectMapper.readTree(postResult.getResponse().getContentAsString()).get("data").get("id").asLong();

        // Admin updates status through valid transitions: PLACED -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED
        for (OrderStatus st : java.util.List.of(OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED)) {
            mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new com.shopsphere.dto.request.OrderStatusUpdateRequestDto(st))))
                    .andExpect(status().isOk());
        }


        mockMvc.perform(get("/api/orders/" + orderId + "/tracking")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentStatus", is("DELIVERED")))
                .andExpect(jsonPath("$.data.delivered", is(true)))
                .andExpect(jsonPath("$.data.timeline[0].state", is("COMPLETED")))
                .andExpect(jsonPath("$.data.timeline[1].state", is("COMPLETED")))
                .andExpect(jsonPath("$.data.timeline[2].state", is("COMPLETED")))
                .andExpect(jsonPath("$.data.timeline[3].state", is("COMPLETED")))
                .andExpect(jsonPath("$.data.timeline[4].state", is("COMPLETED")));
    }

    @Test
    @DisplayName("Cancelled order shows cancellation step")
    void testGetOrderTrackingCancelled() throws Exception {
        addItemToCart(customerToken, product1.getId(), 1);
        OrderCreateRequestDto request = new OrderCreateRequestDto(
                "John Doe", "9876543210", "123 Marine Drive", "Mumbai", "Maharashtra", "400001"
        );
        MvcResult postResult = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        Long orderId = objectMapper.readTree(postResult.getResponse().getContentAsString()).get("data").get("id").asLong();

        // Admin updates status to CANCELLED
        com.shopsphere.dto.request.OrderStatusUpdateRequestDto statusReq =
                new com.shopsphere.dto.request.OrderStatusUpdateRequestDto(com.shopsphere.entity.enums.OrderStatus.CANCELLED);

        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusReq)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/orders/" + orderId + "/tracking")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentStatus", is("CANCELLED")))
                .andExpect(jsonPath("$.data.cancelled", is(true)))
                .andExpect(jsonPath("$.data.timeline[1].status", is("CANCELLED")));
    }

    @Test
    @DisplayName("User cannot access tracking of another customer's order")
    void testOrderTrackingAccessControl() throws Exception {
        addItemToCart(customerToken, product1.getId(), 1);
        OrderCreateRequestDto request = new OrderCreateRequestDto(
                "John Doe", "9876543210", "123 Marine Drive", "Mumbai", "Maharashtra", "400001"
        );
        MvcResult postResult = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        Long orderId = objectMapper.readTree(postResult.getResponse().getContentAsString()).get("data").get("id").asLong();

        // Other customer tries to track this order
        mockMvc.perform(get("/api/orders/" + orderId + "/tracking")
                        .header("Authorization", "Bearer " + otherCustomerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Non-admin user cannot update order status")
    void testNonAdminCannotUpdateOrderStatus() throws Exception {
        com.shopsphere.dto.request.OrderStatusUpdateRequestDto statusReq =
                new com.shopsphere.dto.request.OrderStatusUpdateRequestDto(com.shopsphere.entity.enums.OrderStatus.CONFIRMED);

        mockMvc.perform(patch("/api/orders/1/status")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Full order lifecycle: PLACED -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED (sets COD payment PAID)")
    void testOrderLifecycleTransitions() throws Exception {
        addItemToCart(customerToken, product1.getId(), 1);
        OrderCreateRequestDto request = new OrderCreateRequestDto(
                "Lifecycle User", "9876543210", "456 Park Ave", "Pune", "Maharashtra", "411001", "CASH_ON_DELIVERY"
        );
        MvcResult postResult = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        Long orderId = objectMapper.readTree(postResult.getResponse().getContentAsString()).get("data").get("id").asLong();

        // 1. PLACED -> CONFIRMED
        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new com.shopsphere.dto.request.OrderStatusUpdateRequestDto(OrderStatus.CONFIRMED))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orderStatus", is("CONFIRMED")));

        // 2. CONFIRMED -> PROCESSING
        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new com.shopsphere.dto.request.OrderStatusUpdateRequestDto(OrderStatus.PROCESSING))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orderStatus", is("PROCESSING")));

        // 3. PROCESSING -> SHIPPED
        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new com.shopsphere.dto.request.OrderStatusUpdateRequestDto(OrderStatus.SHIPPED))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orderStatus", is("SHIPPED")));

        // 4. SHIPPED -> DELIVERED (and COD payment status becomes PAID)
        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new com.shopsphere.dto.request.OrderStatusUpdateRequestDto(OrderStatus.DELIVERED))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orderStatus", is("DELIVERED")))
                .andExpect(jsonPath("$.data.paymentStatus", is("PAID")));

        // 5. Verify customer tracking reflects DELIVERED
        mockMvc.perform(get("/api/orders/" + orderId + "/tracking")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentStatus", is("DELIVERED")))
                .andExpect(jsonPath("$.data.delivered", is(true)));
    }

    @Test
    @DisplayName("Invalid transitions are rejected with 400 Bad Request")
    void testInvalidStatusTransitions() throws Exception {
        addItemToCart(customerToken, product1.getId(), 1);
        OrderCreateRequestDto request = new OrderCreateRequestDto(
                "Invalid Test", "9876543210", "456 Park Ave", "Pune", "Maharashtra", "411001"
        );
        MvcResult postResult = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        Long orderId = objectMapper.readTree(postResult.getResponse().getContentAsString()).get("data").get("id").asLong();

        // 1. PLACED -> DELIVERED (invalid jump)
        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new com.shopsphere.dto.request.OrderStatusUpdateRequestDto(OrderStatus.DELIVERED))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Invalid status transition")));

        // 2. PLACED -> SHIPPED (invalid jump)
        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new com.shopsphere.dto.request.OrderStatusUpdateRequestDto(OrderStatus.SHIPPED))))
                .andExpect(status().isBadRequest());

        // 3. PLACED -> PLACED (same status)
        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new com.shopsphere.dto.request.OrderStatusUpdateRequestDto(OrderStatus.PLACED))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("already in PLACED status")));

        // 4. Cancel order
        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new com.shopsphere.dto.request.OrderStatusUpdateRequestDto(OrderStatus.CANCELLED))))
                .andExpect(status().isOk());

        // 5. Try transition from CANCELLED -> CONFIRMED (terminal)
        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new com.shopsphere.dto.request.OrderStatusUpdateRequestDto(OrderStatus.CONFIRMED))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Cancelled orders are final")));
    }

    @Test
    @DisplayName("Admin order listing: pagination, search keyword, status filter, and stats")
    void testAdminOrdersListAndStats() throws Exception {
        addItemToCart(customerToken, product1.getId(), 1);
        OrderCreateRequestDto request = new OrderCreateRequestDto(
                "Searchable Customer", "9876543210", "888 Hill Road", "Delhi", "Delhi", "110001"
        );
        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Admin lists orders
        mockMvc.perform(get("/api/admin/orders")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", not(empty())))
                .andExpect(jsonPath("$.data.content[0].customerName", notNullValue()));

        // Admin filters by status PLACED
        mockMvc.perform(get("/api/admin/orders?status=PLACED")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].orderStatus", is("PLACED")));

        // Admin searches by keyword matching shipping address
        mockMvc.perform(get("/api/admin/orders?keyword=Searchable")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].shippingAddress", containsString("Searchable")));

        // Admin searches by customer name
        mockMvc.perform(get("/api/admin/orders?keyword=Buyer")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].customerName", containsString("Order Buyer")));


        // Admin gets order stats
        mockMvc.perform(get("/api/admin/orders/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.placed", greaterThanOrEqualTo(1)));

        // Non-admin blocked from admin orders endpoint
        mockMvc.perform(get("/api/admin/orders")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }
}

