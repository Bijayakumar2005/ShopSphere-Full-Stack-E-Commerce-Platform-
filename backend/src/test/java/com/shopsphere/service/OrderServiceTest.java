package com.shopsphere.service;

import com.shopsphere.dto.request.OrderCreateRequestDto;
import com.shopsphere.dto.response.OrderResponseDto;
import com.shopsphere.entity.*;
import com.shopsphere.entity.enums.OrderStatus;
import com.shopsphere.entity.enums.PaymentStatus;
import com.shopsphere.entity.enums.Role;
import com.shopsphere.exception.BadRequestException;
import com.shopsphere.repository.CartRepository;
import com.shopsphere.repository.OrderRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.repository.UserRepository;
import com.shopsphere.service.impl.OrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    private User customerAlice;
    private User customerBob;
    private User adminUser;
    private Cart cartAlice;
    private Product laptop;

    @BeforeEach
    void setUp() {
        customerAlice = new User();
        customerAlice.setId(1L);
        customerAlice.setEmail("alice@example.com");
        customerAlice.setName("Alice Wonderland");
        customerAlice.setRole(Role.CUSTOMER);
        customerAlice.setActive(true);

        customerBob = new User();
        customerBob.setId(2L);
        customerBob.setEmail("bob@example.com");
        customerBob.setName("Bob Builder");
        customerBob.setRole(Role.CUSTOMER);
        customerBob.setActive(true);

        adminUser = new User();
        adminUser.setId(99L);
        adminUser.setEmail("admin@shopsphere.com");
        adminUser.setName("System Admin");
        adminUser.setRole(Role.ADMIN);
        adminUser.setActive(true);

        cartAlice = new Cart(customerAlice);
        cartAlice.setId(10L);

        laptop = new Product();
        laptop.setId(50L);
        laptop.setName("Ultra Gaming Laptop");
        laptop.setPrice(BigDecimal.valueOf(1200.00));
        laptop.setOriginalPrice(BigDecimal.valueOf(1400.00));
        laptop.setStockQuantity(10);
        laptop.setActive(true);
    }

    private OrderCreateRequestDto createSampleOrderRequest() {
        return new OrderCreateRequestDto(
                "Alice Wonderland",
                "1234567890",
                "123 Tech Park",
                "Metro City",
                "Tech State",
                "100001",
                "CASH_ON_DELIVERY"
        );
    }

    @Test
    @DisplayName("Important Test 1: Cannot order more than available stock")
    void createOrder_InsufficientStock_ThrowsBadRequestException() {
        // Alice has 15 laptops in cart, but only 10 available in stock
        CartItem item = new CartItem(cartAlice, laptop, 15);
        cartAlice.getItems().add(item);

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(customerAlice));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cartAlice));
        when(productRepository.findById(50L)).thenReturn(Optional.of(laptop));

        OrderCreateRequestDto request = createSampleOrderRequest();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> orderService.createOrder("alice@example.com", request));

        assertThat(ex.getMessage()).contains("Insufficient stock for product \"Ultra Gaming Laptop\"");
        assertThat(ex.getMessage()).contains("Available: 10, requested: 15");

        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("Important Test 2: Frontend cannot manipulate authoritative price")
    void createOrder_AuthoritativePriceCalculation() {
        // Product actual price in database is 1200.00
        CartItem item = new CartItem(cartAlice, laptop, 2);
        cartAlice.getItems().add(item);

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(customerAlice));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cartAlice));
        when(productRepository.findById(50L)).thenReturn(Optional.of(laptop));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(500L);
            return o;
        });

        OrderCreateRequestDto request = createSampleOrderRequest();
        OrderResponseDto response = orderService.createOrder("alice@example.com", request);

        assertThat(response).isNotNull();
        // Authoritative calculation from Product: 1200.00 * 2 = 2400.00
        assertThat(response.getSubtotal()).isEqualByComparingTo(BigDecimal.valueOf(2400.00));
        // Subtotal >= 999 -> shippingFee is 0
        assertThat(response.getShippingFee()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(2400.00));
        // Discount: (1400 - 1200) * 2 = 400.00
        assertThat(response.getDiscountAmount()).isEqualByComparingTo(BigDecimal.valueOf(400.00));

        verify(orderRepository).save(argThat(order ->
                order.getSubtotal().compareTo(BigDecimal.valueOf(2400.00)) == 0 &&
                order.getTotalAmount().compareTo(BigDecimal.valueOf(2400.00)) == 0
        ));
    }

    @Test
    @DisplayName("Important Test 3: Empty cart cannot become an order")
    void createOrder_EmptyCart_ThrowsBadRequestException() {
        // Cart has 0 items
        assertThat(cartAlice.getItems()).isEmpty();

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(customerAlice));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cartAlice));

        OrderCreateRequestDto request = createSampleOrderRequest();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> orderService.createOrder("alice@example.com", request));

        assertThat(ex.getMessage()).contains("Cannot create order from an empty cart");
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("Important Test 4: Customer cannot access another customer's order")
    void getOrderById_CrossCustomerAccess_ThrowsAccessDeniedException() {
        Order alicesOrder = new Order();
        alicesOrder.setId(101L);
        alicesOrder.setOrderNumber("ORD-101");
        alicesOrder.setUser(customerAlice); // belongs to Alice (ID: 1)

        // Bob (ID: 2) attempts to view Alice's order
        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(customerBob));
        when(orderRepository.findById(101L)).thenReturn(Optional.of(alicesOrder));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class,
                () -> orderService.getOrderById("bob@example.com", "101"));

        assertThat(ex.getMessage()).contains("do not have permission");
    }

    @Test
    @DisplayName("Important Test 4b: Customer cannot access another customer's order tracking")
    void getOrderTracking_CrossCustomerAccess_ThrowsAccessDeniedException() {
        Order alicesOrder = new Order();
        alicesOrder.setId(101L);
        alicesOrder.setOrderNumber("ORD-101");
        alicesOrder.setUser(customerAlice);

        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(customerBob));
        when(orderRepository.findById(101L)).thenReturn(Optional.of(alicesOrder));

        assertThrows(AccessDeniedException.class,
                () -> orderService.getOrderTracking("bob@example.com", "101"));
    }

    @Test
    @DisplayName("Important Test 4c: Admin can access any customer's order")
    void getOrderById_AdminAccess_Success() {
        Order alicesOrder = new Order();
        alicesOrder.setId(101L);
        alicesOrder.setOrderNumber("ORD-101");
        alicesOrder.setUser(customerAlice);
        alicesOrder.setSubtotal(BigDecimal.valueOf(1200));
        alicesOrder.setTotalAmount(BigDecimal.valueOf(1200));
        alicesOrder.setOrderStatus(OrderStatus.PLACED);
        alicesOrder.setPaymentStatus(PaymentStatus.PENDING);

        when(userRepository.findByEmail("admin@shopsphere.com")).thenReturn(Optional.of(adminUser));
        when(orderRepository.findById(101L)).thenReturn(Optional.of(alicesOrder));

        OrderResponseDto response = orderService.getOrderById("admin@shopsphere.com", "101");

        assertThat(response).isNotNull();
        assertThat(response.getOrderNumber()).isEqualTo("ORD-101");
    }

    @Test
    @DisplayName("Important Test 6: Admin can update order status through valid transitions")
    void updateOrderStatus_ValidProgression_Success() {
        Order order = new Order();
        order.setId(201L);
        order.setOrderStatus(OrderStatus.PLACED);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setPaymentMethod("CASH_ON_DELIVERY");

        when(orderRepository.findById(201L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Step 1: PLACED -> CONFIRMED
        OrderResponseDto confirmed = orderService.updateOrderStatus(201L, OrderStatus.CONFIRMED);
        assertThat(confirmed.getOrderStatus()).isEqualTo(OrderStatus.CONFIRMED);

        // Step 2: CONFIRMED -> PROCESSING
        OrderResponseDto processing = orderService.updateOrderStatus(201L, OrderStatus.PROCESSING);
        assertThat(processing.getOrderStatus()).isEqualTo(OrderStatus.PROCESSING);

        // Step 3: PROCESSING -> SHIPPED
        OrderResponseDto shipped = orderService.updateOrderStatus(201L, OrderStatus.SHIPPED);
        assertThat(shipped.getOrderStatus()).isEqualTo(OrderStatus.SHIPPED);

        // Step 4: SHIPPED -> DELIVERED (COD auto-marks PAID)
        OrderResponseDto delivered = orderService.updateOrderStatus(201L, OrderStatus.DELIVERED);
        assertThat(delivered.getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(delivered.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
    }

    @Test
    @DisplayName("Important Test 6b: Rejects invalid order status transition")
    void updateOrderStatus_InvalidTransition_ThrowsBadRequestException() {
        Order order = new Order();
        order.setId(202L);
        order.setOrderStatus(OrderStatus.PLACED);

        when(orderRepository.findById(202L)).thenReturn(Optional.of(order));

        // Skipping steps: PLACED -> DELIVERED is invalid
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> orderService.updateOrderStatus(202L, OrderStatus.DELIVERED));

        assertThat(ex.getMessage()).contains("Invalid status transition from PLACED to DELIVERED");
    }

    @Test
    @DisplayName("Important Test 7: Order creation updates stock correctly")
    void createOrder_ReducesProductStockCorrectly() {
        assertThat(laptop.getStockQuantity()).isEqualTo(10);

        CartItem item = new CartItem(cartAlice, laptop, 3);
        cartAlice.getItems().add(item);

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(customerAlice));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cartAlice));
        when(productRepository.findById(50L)).thenReturn(Optional.of(laptop));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(501L);
            return o;
        });

        orderService.createOrder("alice@example.com", createSampleOrderRequest());

        // Initial 10 - 3 ordered = 7
        assertThat(laptop.getStockQuantity()).isEqualTo(7);
        verify(productRepository).save(argThat(p -> p.getId().equals(50L) && p.getStockQuantity() == 7));
        verify(cartRepository).save(argThat(cart -> cart.getItems().isEmpty()));
    }

    @Test
    @DisplayName("Important Test 7b: Order cancellation restores stock correctly")
    void cancelOrder_RestoresProductStock() {
        laptop.setStockQuantity(7); // stock was 7 after ordering 3

        Order order = new Order();
        order.setId(301L);
        order.setOrderStatus(OrderStatus.PROCESSING);

        OrderItem orderItem = new OrderItem(order, laptop, "Ultra Gaming Laptop", BigDecimal.valueOf(1200), 3);
        order.addItem(orderItem);

        when(orderRepository.findById(301L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponseDto cancelled = orderService.updateOrderStatus(301L, OrderStatus.CANCELLED);

        assertThat(cancelled.getOrderStatus()).isEqualTo(OrderStatus.CANCELLED);
        // 7 + 3 restored = 10
        assertThat(laptop.getStockQuantity()).isEqualTo(10);
        verify(productRepository).save(argThat(p -> p.getId().equals(50L) && p.getStockQuantity() == 10));
    }
}
