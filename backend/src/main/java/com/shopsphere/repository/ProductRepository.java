package com.shopsphere.repository;

import com.shopsphere.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.domain.Specification;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    @Override
    @EntityGraph(attributePaths = {"category"})
    Page<Product> findAll(Specification<Product> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"category"})
    Page<Product> findByActiveTrue(Pageable pageable);

    @EntityGraph(attributePaths = {"category"})
    Page<Product> findByCategoryIdAndActiveTrue(Long categoryId, Pageable pageable);

    @EntityGraph(attributePaths = {"category"})
    @Query("SELECT p FROM Product p WHERE p.active = true " +
           "AND (:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:categoryId IS NULL OR p.category.id = :categoryId) " +
           "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR p.price <= :maxPrice)")
    Page<Product> searchProducts(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable
    );

    long countByActiveTrue();

    long countByStockQuantityLessThanEqualAndActiveTrue(Integer threshold);

    @EntityGraph(attributePaths = {"category"})
    java.util.List<Product> findTop5ByStockQuantityLessThanEqualAndActiveTrueOrderByStockQuantityAsc(Integer threshold);

    long countByCategoryId(Long categoryId);

    long countByCategoryIdAndActiveTrue(Long categoryId);

    @Query("SELECT p.category.id, COUNT(p) FROM Product p GROUP BY p.category.id")
    java.util.List<Object[]> countProductsGroupedByCategory();

    // ---- Admin Inventory ----

    /** All products for admin inventory — includes inactive (soft-deleted) products. */
    @EntityGraph(attributePaths = {"category"})
    @Query("SELECT p FROM Product p WHERE " +
           "(:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           " OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:stockStatus IS NULL OR " +
           "     (:stockStatus = 'OUT_OF_STOCK' AND p.stockQuantity = 0) OR " +
           "     (:stockStatus = 'LOW_STOCK'    AND p.stockQuantity > 0 AND p.stockQuantity <= :lowStockThreshold) OR " +
           "     (:stockStatus = 'IN_STOCK'     AND p.stockQuantity > :lowStockThreshold))")
    Page<Product> findAllForInventory(
            @Param("keyword") String keyword,
            @Param("stockStatus") String stockStatus,
            @Param("lowStockThreshold") int lowStockThreshold,
            Pageable pageable
    );

    /** Total products (active only) */
    long countByActiveTrueAndStockQuantityEquals(Integer stockQuantity);

    @Query("SELECT COUNT(p), " +
           "SUM(CASE WHEN p.stockQuantity = 0 THEN 1L ELSE 0L END), " +
           "SUM(CASE WHEN p.stockQuantity > 0 AND p.stockQuantity <= :threshold THEN 1L ELSE 0L END), " +
           "SUM(CASE WHEN p.stockQuantity > :threshold THEN 1L ELSE 0L END), " +
           "COALESCE(SUM(p.stockQuantity), 0L) " +
           "FROM Product p WHERE p.active = true")
    java.util.List<Object[]> getConsolidatedInventoryStats(@Param("threshold") int threshold);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.active = true AND p.stockQuantity = 0")
    long countOutOfStock();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.active = true AND p.stockQuantity > 0 AND p.stockQuantity <= :threshold")
    long countLowStock(@Param("threshold") int threshold);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.active = true AND p.stockQuantity > :threshold")
    long countInStock(@Param("threshold") int threshold);

    @Query("SELECT SUM(p.stockQuantity) FROM Product p WHERE p.active = true")
    Long sumTotalStock();
}

