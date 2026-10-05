package com.shopsphere.repository;

import com.shopsphere.entity.Order;
import com.shopsphere.entity.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    Page<Order> findByUserId(Long userId, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"user"})
    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<Order> findByIdAndUserId(Long id, Long userId);

    Optional<Order> findByOrderNumberAndUserId(String orderNumber, Long userId);

    Page<Order> findByOrderStatus(OrderStatus orderStatus, Pageable pageable);

    long countByOrderStatus(OrderStatus orderStatus);

    @org.springframework.data.jpa.repository.Query("SELECT o.orderStatus, COUNT(o) FROM Order o GROUP BY o.orderStatus")
    java.util.List<Object[]> countOrdersByStatusGrouped();

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"user"})
    java.util.List<Order> findTop5ByOrderByCreatedAtDesc();

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.orderStatus != com.shopsphere.entity.enums.OrderStatus.CANCELLED")
    java.math.BigDecimal calculateTotalRevenue();

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"user"})
    @org.springframework.data.jpa.repository.Query("SELECT o FROM Order o WHERE " +
           "(:keyword IS NULL OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           " OR LOWER(o.user.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           " OR LOWER(o.user.email) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           " OR LOWER(o.shippingAddress) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:orderStatus IS NULL OR o.orderStatus = :orderStatus)")
    Page<Order> findAllForAdmin(
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            @org.springframework.data.repository.query.Param("orderStatus") OrderStatus orderStatus,
            Pageable pageable
    );
}

