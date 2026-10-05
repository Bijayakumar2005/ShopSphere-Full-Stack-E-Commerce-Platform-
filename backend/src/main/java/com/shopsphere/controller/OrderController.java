package com.shopsphere.controller;

import com.shopsphere.dto.request.OrderCreateRequestDto;
import com.shopsphere.dto.response.ApiResponse;
import com.shopsphere.dto.response.OrderResponseDto;
import com.shopsphere.dto.response.PagedResponse;
import com.shopsphere.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Create order from user's shopping cart.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponseDto>> createOrder(
            Authentication authentication,
            @Valid @RequestBody OrderCreateRequestDto request
    ) {
        String email = authentication.getName();
        OrderResponseDto order = orderService.createOrder(email, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order placed successfully", order));
    }

    /**
     * Get paginated list of user's orders.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<OrderResponseDto>>> getOrders(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        String email = authentication.getName();
        PagedResponse<OrderResponseDto> orders = orderService.getUserOrders(email, page, size);
        return ResponseEntity.ok(ApiResponse.success("Orders fetched successfully", orders));
    }

    /**
     * Get order details by ID or order number.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponseDto>> getOrderById(
            Authentication authentication,
            @PathVariable String id
    ) {
        String email = authentication.getName();
        OrderResponseDto order = orderService.getOrderById(email, id);
        return ResponseEntity.ok(ApiResponse.success("Order fetched successfully", order));
    }

    /**
     * Get real-time order tracking details with visual timeline.
     */
    @GetMapping("/{id}/tracking")
    public ResponseEntity<ApiResponse<com.shopsphere.dto.response.OrderTrackingResponseDto>> getOrderTracking(
            Authentication authentication,
            @PathVariable String id
    ) {
        String email = authentication.getName();
        com.shopsphere.dto.response.OrderTrackingResponseDto tracking = orderService.getOrderTracking(email, id);
        return ResponseEntity.ok(ApiResponse.success("Order tracking fetched successfully", tracking));
    }

    /**
     * Update order status (Admin operation).
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponseDto>> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody com.shopsphere.dto.request.OrderStatusUpdateRequestDto request
    ) {
        OrderResponseDto updated = orderService.updateOrderStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully", updated));
    }
}
