package com.shopsphere.service;

import com.shopsphere.dto.request.OrderCreateRequestDto;
import com.shopsphere.dto.response.OrderResponseDto;
import com.shopsphere.dto.response.PagedResponse;

public interface OrderService {

    /**
     * Create order from user's current shopping cart with authoritative price recalculation,
     * stock validation & reduction, and cart clearing inside a single database transaction.
     */
    OrderResponseDto createOrder(String userEmail, OrderCreateRequestDto request);

    /**
     * Get paginated orders for the authenticated user.
     */
    PagedResponse<OrderResponseDto> getUserOrders(String userEmail, int page, int size);

    /**
     * Get single order by ID or order number, verifying ownership or admin privilege.
     */
    OrderResponseDto getOrderById(String userEmail, String idOrOrderNumber);

    /**
     * Get order tracking information with live status timeline.
     */
    com.shopsphere.dto.response.OrderTrackingResponseDto getOrderTracking(String userEmail, String idOrOrderNumber);

    /**
     * Update order status (Admin / system operation).
     */
    OrderResponseDto updateOrderStatus(Long orderId, com.shopsphere.entity.enums.OrderStatus newStatus);

    /**
     * Get paginated orders for Admin with optional search keyword and status filter.
     */
    PagedResponse<OrderResponseDto> getAllOrdersForAdmin(
            String keyword,
            com.shopsphere.entity.enums.OrderStatus status,
            int page,
            int size,
            String sortBy,
            String sortDir
    );

    /**
     * Get aggregated counts of orders grouped by status.
     */
    java.util.Map<String, Object> getOrderStats();
}

