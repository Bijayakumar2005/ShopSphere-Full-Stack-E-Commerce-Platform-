package com.shopsphere.controller;

import com.shopsphere.dto.request.OrderStatusUpdateRequestDto;
import com.shopsphere.dto.response.AdminDashboardResponseDto;
import com.shopsphere.dto.response.ApiResponse;
import com.shopsphere.dto.response.OrderResponseDto;
import com.shopsphere.dto.response.PagedResponse;
import com.shopsphere.dto.response.ProductResponseDto;
import com.shopsphere.entity.enums.OrderStatus;
import com.shopsphere.service.AdminService;
import com.shopsphere.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Thin REST Controller for administrative operations.
 * All aggregation, querying, and business logic is delegated to the service layer.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final OrderService orderService;

    public AdminController(AdminService adminService, OrderService orderService) {
        this.adminService = adminService;
        this.orderService = orderService;
    }

    /**
     * Admin Dashboard Overview: statistics, status distribution, recent orders, and low-stock alerts.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AdminDashboardResponseDto>> getDashboardOverview() {
        AdminDashboardResponseDto dto = adminService.getDashboardOverview();
        return ResponseEntity.ok(ApiResponse.success("Admin dashboard statistics retrieved successfully", dto));
    }

    /**
     * Admin Inventory: paginated product list with search, filter, and sorting.
     */
    @GetMapping("/inventory")
    public ResponseEntity<ApiResponse<PagedResponse<ProductResponseDto>>> getInventory(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String stockStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "stockQuantity") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        PagedResponse<ProductResponseDto> response = adminService.getInventory(
                keyword, stockStatus, page, size, sortBy, sortDir
        );
        return ResponseEntity.ok(ApiResponse.success("Inventory fetched successfully", response));
    }

    /**
     * Admin Inventory Statistics: aggregated stock level counts and total inventory units.
     */
    @GetMapping("/inventory/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getInventoryStats() {
        Map<String, Object> stats = adminService.getInventoryStats();
        return ResponseEntity.ok(ApiResponse.success("Inventory stats fetched", stats));
    }

    /**
     * Admin Orders: paginated order list with search, status filtering, and sorting.
     */
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<PagedResponse<OrderResponseDto>>> getAdminOrders(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        PagedResponse<OrderResponseDto> orders = orderService.getAllOrdersForAdmin(
                keyword, status, page, size, sortBy, sortDir
        );
        return ResponseEntity.ok(ApiResponse.success("Admin orders retrieved successfully", orders));
    }

    /**
     * Admin Order Details: retrieve specific order by ID or order number.
     */
    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<OrderResponseDto>> getAdminOrderById(
            Authentication authentication,
            @PathVariable String id
    ) {
        OrderResponseDto order = orderService.getOrderById(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Order fetched successfully", order));
    }

    /**
     * Admin Order Status: update status with transition validation.
     */
    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponseDto>> updateAdminOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateRequestDto request
    ) {
        OrderResponseDto updated = orderService.updateOrderStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully", updated));
    }

    /**
     * Admin Order Statistics: order counts grouped by status.
     */
    @GetMapping("/orders/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminOrderStats() {
        Map<String, Object> stats = orderService.getOrderStats();
        return ResponseEntity.ok(ApiResponse.success("Order stats retrieved successfully", stats));
    }
}


