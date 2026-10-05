package com.shopsphere.service.impl;

import com.shopsphere.dto.request.OrderCreateRequestDto;
import com.shopsphere.dto.response.OrderItemResponseDto;
import com.shopsphere.dto.response.OrderResponseDto;
import com.shopsphere.dto.response.OrderTrackingResponseDto;
import com.shopsphere.dto.response.PagedResponse;
import com.shopsphere.dto.response.TrackingStepDto;
import com.shopsphere.entity.*;
import com.shopsphere.entity.enums.OrderStatus;
import com.shopsphere.entity.enums.PaymentStatus;
import com.shopsphere.entity.enums.Role;
import com.shopsphere.exception.BadRequestException;
import com.shopsphere.exception.ResourceNotFoundException;
import com.shopsphere.repository.*;
import com.shopsphere.service.OrderService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class OrderServiceImpl implements OrderService {


    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final Random random = new Random();

    public OrderServiceImpl(
            OrderRepository orderRepository,
            CartRepository cartRepository,
            ProductRepository productRepository,
            UserRepository userRepository
    ) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    @Override
    @Transactional
    public OrderResponseDto createOrder(String userEmail, OrderCreateRequestDto request) {
        // 1. Retrieve authenticated user and cart from database
        User user = getAuthenticatedUser(userEmail);
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException("Cannot create order from an empty cart."));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new BadRequestException("Cannot create order from an empty cart.");
        }

        // Prepare order calculations
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discount = BigDecimal.ZERO;

        // 2 & 3. Retrieve current product prices & validate stock for all items
        for (CartItem cartItem : cart.getItems()) {
            Product product = productRepository.findById(cartItem.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", cartItem.getProduct().getId()));

            if (!product.isActive()) {
                throw new BadRequestException("Product \"" + product.getName() + "\" is no longer available for purchase.");
            }

            int availableStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
            if (availableStock < cartItem.getQuantity()) {
                throw new BadRequestException("Insufficient stock for product \"" + product.getName() +
                        "\". Available: " + availableStock + ", requested: " + cartItem.getQuantity() + ".");
            }

            // 4. Recalculate subtotal using current database price
            BigDecimal itemSubtotal = product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            subtotal = subtotal.add(itemSubtotal);

            // 5. Recalculate discount
            if (product.getOriginalPrice() != null && product.getOriginalPrice().compareTo(product.getPrice()) > 0) {
                BigDecimal itemDiff = product.getOriginalPrice().subtract(product.getPrice());
                discount = discount.add(itemDiff.multiply(BigDecimal.valueOf(cartItem.getQuantity())));
            }
        }

        // 6. Calculate final shipping and total
        // Free delivery on orders 999 and above, otherwise 99
        BigDecimal shippingFee = (subtotal.compareTo(BigDecimal.valueOf(999)) >= 0)
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(99);
        BigDecimal totalAmount = subtotal.add(shippingFee);

        // 7. Create order entity
        String orderNumber = "ORD-" + System.currentTimeMillis() + "-" + String.format("%04d", random.nextInt(10000));
        Order order = new Order();
        order.setOrderNumber(orderNumber);
        order.setUser(user);
        order.setSubtotal(subtotal);
        order.setDiscountAmount(discount);
        order.setShippingFee(shippingFee);
        order.setTotalAmount(totalAmount);
        order.setOrderStatus(OrderStatus.PLACED);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH_ON_DELIVERY");
        order.setShippingAddress(request.getFormattedShippingAddress());

        // 8. Create order items & 9. Reduce stock
        for (CartItem cartItem : cart.getItems()) {
            Product product = productRepository.findById(cartItem.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", cartItem.getProduct().getId()));

            OrderItem orderItem = new OrderItem(
                    order,
                    product,
                    product.getName(),
                    product.getPrice(),
                    cartItem.getQuantity()
            );
            order.addItem(orderItem);

            // 9. Reduce stock
            product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
            productRepository.save(product);
        }

        // 10. Clear cart
        cart.clear();
        cartRepository.save(cart);

        // Save order and items
        Order savedOrder = orderRepository.save(order);

        return OrderResponseDto.fromEntity(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<OrderResponseDto> getUserOrders(String userEmail, int page, int size) {
        User user = getAuthenticatedUser(userEmail);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));

        Page<Order> orderPage = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
        List<OrderResponseDto> dtos = new ArrayList<>();
        for (Order order : orderPage.getContent()) {
            dtos.add(OrderResponseDto.fromEntity(order));
        }

        return PagedResponse.of(orderPage, dtos);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponseDto getOrderById(String userEmail, String idOrOrderNumber) {
        User user = getAuthenticatedUser(userEmail);

        Order order;
        if (idOrOrderNumber.matches("^\\d+$")) {
            Long id = Long.parseLong(idOrOrderNumber);
            order = orderRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Order", "id", idOrOrderNumber));
        } else {
            order = orderRepository.findByOrderNumber(idOrOrderNumber)
                    .orElseThrow(() -> new ResourceNotFoundException("Order", "orderNumber", idOrOrderNumber));
        }

        // Ensure user owns this order or has ADMIN role
        if (!order.getUser().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("You do not have permission to view this order.");
        }

        return OrderResponseDto.fromEntity(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderTrackingResponseDto getOrderTracking(String userEmail, String idOrOrderNumber) {
        User user = getAuthenticatedUser(userEmail);

        Order order;
        if (idOrOrderNumber.matches("^\\d+$")) {
            Long id = Long.parseLong(idOrOrderNumber);
            order = orderRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Order", "id", idOrOrderNumber));
        } else {
            order = orderRepository.findByOrderNumber(idOrOrderNumber)
                    .orElseThrow(() -> new ResourceNotFoundException("Order", "orderNumber", idOrOrderNumber));
        }

        // Access control check
        if (!order.getUser().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("You do not have permission to track this order.");
        }

        OrderStatus currentStatus = order.getOrderStatus();
        List<TrackingStepDto> timeline = new ArrayList<>();

        if (currentStatus == OrderStatus.CANCELLED) {
            // Cancelled flow
            timeline.add(new TrackingStepDto(
                    "PLACED",
                    "Order Placed",
                    "Order was created and submitted.",
                    order.getCreatedAt(),
                    "COMPLETED"
            ));
            timeline.add(new TrackingStepDto(
                    "CANCELLED",
                    "Order Cancelled",
                    "This order has been cancelled.",
                    order.getUpdatedAt() != null ? order.getUpdatedAt() : order.getCreatedAt(),
                    "CURRENT"
            ));
            return OrderTrackingResponseDto.fromEntity(order, timeline, -1);
        }

        // Define the 5 linear progress steps
        String[] statuses = {"PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"};
        String[] titles = {"Order Placed", "Order Confirmed", "Processing", "Shipped", "Delivered"};
        String[] descriptions = {
                "Your order has been received and logged.",
                "Merchant has confirmed your order details.",
                "Items are inspected, prepared, and packed for shipment.",
                "Package is in transit with our logistics partner.",
                "Package delivered to your specified shipping address."
        };

        int currentIndex = 0;
        switch (currentStatus) {
            case PLACED -> currentIndex = 0;
            case CONFIRMED -> currentIndex = 1;
            case PROCESSING -> currentIndex = 2;
            case SHIPPED -> currentIndex = 3;
            case DELIVERED -> currentIndex = 4;
            default -> currentIndex = 0;
        }

        for (int i = 0; i < statuses.length; i++) {
            String stepStatus = statuses[i];
            String stepTitle = titles[i];
            String stepDesc = descriptions[i];
            String stepState;
            java.time.LocalDateTime stepTimestamp = null;

            if (currentStatus == OrderStatus.DELIVERED) {
                stepState = "COMPLETED";
                stepTimestamp = (i == 4 && order.getUpdatedAt() != null) ? order.getUpdatedAt() : order.getCreatedAt();
            } else if (i < currentIndex) {
                stepState = "COMPLETED";
                stepTimestamp = order.getCreatedAt();
            } else if (i == currentIndex) {
                stepState = "CURRENT";
                stepTimestamp = order.getUpdatedAt() != null ? order.getUpdatedAt() : order.getCreatedAt();
            } else {
                stepState = "UPCOMING";
                stepTimestamp = null;
            }

            timeline.add(new TrackingStepDto(stepStatus, stepTitle, stepDesc, stepTimestamp, stepState));
        }

        return OrderTrackingResponseDto.fromEntity(order, timeline, currentIndex);
    }

    @Override
    @Transactional
    public OrderResponseDto updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        OrderStatus previousStatus = order.getOrderStatus();
        validateStatusTransition(previousStatus, newStatus);

        order.setOrderStatus(newStatus);

        // If newly delivered via COD, mark payment as PAID
        if (newStatus == OrderStatus.DELIVERED && 
                ("COD".equalsIgnoreCase(order.getPaymentMethod()) || "CASH_ON_DELIVERY".equalsIgnoreCase(order.getPaymentMethod()))) {
            order.setPaymentStatus(PaymentStatus.PAID);
        }

        // If order was cancelled and was not already cancelled/delivered, restore stock
        if (newStatus == OrderStatus.CANCELLED && previousStatus != OrderStatus.CANCELLED && previousStatus != OrderStatus.DELIVERED) {
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    Product p = item.getProduct();
                    if (p != null) {
                        p.setStockQuantity(p.getStockQuantity() + item.getQuantity());
                        productRepository.save(p);
                    }
                }
            }
        }

        Order saved = orderRepository.save(order);
        return OrderResponseDto.fromEntity(saved);
    }

    private void validateStatusTransition(OrderStatus currentStatus, OrderStatus newStatus) {
        if (newStatus == null) {
            throw new BadRequestException("Order status cannot be null.");
        }

        if (currentStatus == newStatus) {
            throw new BadRequestException("Order is already in " + currentStatus + " status.");
        }

        if (currentStatus == OrderStatus.DELIVERED) {
            throw new BadRequestException("Delivered orders are final and cannot be modified.");
        }

        if (currentStatus == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cancelled orders are final and cannot be modified.");
        }

        boolean isValid = false;
        switch (currentStatus) {
            case PLACED -> isValid = (newStatus == OrderStatus.CONFIRMED || newStatus == OrderStatus.CANCELLED);
            case CONFIRMED -> isValid = (newStatus == OrderStatus.PROCESSING || newStatus == OrderStatus.CANCELLED);
            case PROCESSING -> isValid = (newStatus == OrderStatus.SHIPPED || newStatus == OrderStatus.CANCELLED);
            case SHIPPED -> isValid = (newStatus == OrderStatus.DELIVERED || newStatus == OrderStatus.CANCELLED);
            default -> isValid = false;
        }

        if (!isValid) {
            throw new BadRequestException(
                    String.format("Invalid status transition from %s to %s. Orders must progress: PLACED -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED, or be CANCELLED.",
                            currentStatus, newStatus)
            );
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<OrderResponseDto> getAllOrdersForAdmin(
            String keyword,
            OrderStatus status,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 100);

        String safeSortBy = "createdAt";
        if ("totalamount".equalsIgnoreCase(sortBy) || "total_amount".equalsIgnoreCase(sortBy)) {
            safeSortBy = "totalAmount";
        } else if ("ordernumber".equalsIgnoreCase(sortBy) || "order_number".equalsIgnoreCase(sortBy)) {
            safeSortBy = "orderNumber";
        } else if ("orderstatus".equalsIgnoreCase(sortBy) || "order_status".equalsIgnoreCase(sortBy)) {
            safeSortBy = "orderStatus";
        }

        Sort sort = "asc".equalsIgnoreCase(sortDir)
                ? Sort.by(safeSortBy).ascending()
                : Sort.by(safeSortBy).descending();

        Pageable pageable = PageRequest.of(safePage, safeSize, sort);
        String keywordParam = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;

        Page<Order> orderPage = orderRepository.findAllForAdmin(keywordParam, status, pageable);
        List<OrderResponseDto> dtos = orderPage.getContent()
                .stream()
                .map(OrderResponseDto::fromEntity)
                .toList();

        return PagedResponse.of(orderPage, dtos);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getOrderStats() {
        Map<String, Object> stats = new HashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            stats.put(status.name().toLowerCase(), 0L);
        }

        List<Object[]> statusCounts = orderRepository.countOrdersByStatusGrouped();
        long total = 0L;
        for (Object[] row : statusCounts) {
            OrderStatus status = (OrderStatus) row[0];
            Long cnt = (Long) row[1];
            stats.put(status.name().toLowerCase(), cnt);
            total += cnt;
        }

        stats.put("total", total);
        return stats;
    }
}

