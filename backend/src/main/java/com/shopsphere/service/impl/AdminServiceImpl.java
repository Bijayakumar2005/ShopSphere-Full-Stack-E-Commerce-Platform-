package com.shopsphere.service.impl;

import com.shopsphere.dto.response.AdminDashboardResponseDto;
import com.shopsphere.dto.response.OrderResponseDto;
import com.shopsphere.dto.response.PagedResponse;
import com.shopsphere.dto.response.ProductResponseDto;
import com.shopsphere.entity.Order;
import com.shopsphere.entity.Product;
import com.shopsphere.entity.enums.OrderStatus;
import com.shopsphere.entity.enums.Role;
import com.shopsphere.repository.OrderRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.repository.UserRepository;
import com.shopsphere.service.AdminService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminServiceImpl implements AdminService {

    private static final int LOW_STOCK_THRESHOLD = 10;

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public AdminServiceImpl(
            UserRepository userRepository,
            OrderRepository orderRepository,
            ProductRepository productRepository
    ) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardResponseDto getDashboardOverview() {
        AdminDashboardResponseDto dto = new AdminDashboardResponseDto();

        // High-level counts
        dto.setTotalProducts(productRepository.countByActiveTrue());
        dto.setTotalCustomers(userRepository.countByRole(Role.CUSTOMER));

        // Grouped status query replaces 6 separate count queries
        Map<String, Long> distribution = new HashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            distribution.put(status.name(), 0L);
        }
        List<Object[]> statusCounts = orderRepository.countOrdersByStatusGrouped();
        long totalOrders = 0L;
        for (Object[] row : statusCounts) {
            OrderStatus status = (OrderStatus) row[0];
            Long cnt = (Long) row[1];
            distribution.put(status.name(), cnt);
            totalOrders += cnt;
        }
        dto.setTotalOrders(totalOrders);

        long placed = distribution.getOrDefault("PLACED", 0L);
        long confirmed = distribution.getOrDefault("CONFIRMED", 0L);
        long processing = distribution.getOrDefault("PROCESSING", 0L);
        long delivered = distribution.getOrDefault("DELIVERED", 0L);

        dto.setPendingOrders(placed + confirmed + processing);
        dto.setDeliveredOrders(delivered);
        dto.setLowStockProducts(productRepository.countByStockQuantityLessThanEqualAndActiveTrue(LOW_STOCK_THRESHOLD));

        BigDecimal revenue = orderRepository.calculateTotalRevenue();
        dto.setTotalRevenue(revenue != null ? revenue : BigDecimal.ZERO);

        dto.setOrderStatusDistribution(distribution);

        // Recent 5 orders
        List<Order> recentOrders = orderRepository.findTop5ByOrderByCreatedAtDesc();
        List<OrderResponseDto> recentOrderDtos = recentOrders.stream()
                .map(OrderResponseDto::fromEntity)
                .collect(Collectors.toList());
        dto.setRecentOrders(recentOrderDtos);

        // Low stock products list (<= 10)
        List<Product> lowStockProducts = productRepository.findTop5ByStockQuantityLessThanEqualAndActiveTrueOrderByStockQuantityAsc(LOW_STOCK_THRESHOLD);
        List<ProductResponseDto> lowStockDtos = lowStockProducts.stream()
                .map(ProductResponseDto::fromEntity)
                .collect(Collectors.toList());
        dto.setLowStockList(lowStockDtos);

        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ProductResponseDto> getInventory(
            String keyword,
            String stockStatus,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 100);

        String safeSortBy = switch (sortBy != null ? sortBy.toLowerCase() : "") {
            case "name" -> "name";
            case "price" -> "price";
            case "brand" -> "brand";
            default -> "stockQuantity";
        };

        Sort sort = "desc".equalsIgnoreCase(sortDir)
                ? Sort.by(safeSortBy).descending()
                : Sort.by(safeSortBy).ascending();

        // Secondary sort by name for stable ordering
        if (!"name".equals(safeSortBy)) {
            sort = sort.and(Sort.by("name").ascending());
        }

        Pageable pageable = PageRequest.of(safePage, safeSize, sort);

        String keywordParam = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String statusParam = (stockStatus != null && !stockStatus.trim().isEmpty()) ? stockStatus.trim().toUpperCase() : null;

        Page<Product> productPage = productRepository.findAllForInventory(
                keywordParam, statusParam, LOW_STOCK_THRESHOLD, pageable
        );

        List<ProductResponseDto> dtos = productPage.getContent()
                .stream()
                .map(ProductResponseDto::fromEntity)
                .toList();

        return PagedResponse.of(productPage, dtos);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getInventoryStats() {
        List<Object[]> rows = productRepository.getConsolidatedInventoryStats(LOW_STOCK_THRESHOLD);
        long totalProducts = 0L;
        long outOfStock = 0L;
        long lowStock = 0L;
        long inStock = 0L;
        long totalUnits = 0L;

        if (rows != null && !rows.isEmpty() && rows.get(0) != null) {
            Object[] row = rows.get(0);
            totalProducts = row[0] != null ? ((Number) row[0]).longValue() : 0L;
            outOfStock = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            lowStock = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            inStock = row[3] != null ? ((Number) row[3]).longValue() : 0L;
            totalUnits = row[4] != null ? ((Number) row[4]).longValue() : 0L;
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProducts", totalProducts);
        stats.put("inStock", inStock);
        stats.put("lowStock", lowStock);
        stats.put("outOfStock", outOfStock);
        stats.put("totalUnits", totalUnits);
        stats.put("lowStockThreshold", LOW_STOCK_THRESHOLD);

        return stats;
    }
}
