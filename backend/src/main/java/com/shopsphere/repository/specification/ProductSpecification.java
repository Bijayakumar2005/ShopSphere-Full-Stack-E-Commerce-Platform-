package com.shopsphere.repository.specification;

import com.shopsphere.entity.Category;
import com.shopsphere.entity.Product;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Spring Data JPA Specification builder for dynamic product filtering and search.
 * Constructs optimized SQL queries using the JPA Criteria API.
 */
public class ProductSpecification {

    private ProductSpecification() {
        // Utility class
    }

    public static Specification<Product> filter(
            String keyword,
            String category,
            Long categoryId,
            String brand,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Double minRating
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Always enforce active products
            predicates.add(criteriaBuilder.isTrue(root.get("active")));

            // 2. Keyword search: match across product name, brand, or description
            if (keyword != null && !keyword.trim().isEmpty()) {
                String searchPattern = "%" + keyword.trim().toLowerCase() + "%";
                Predicate nameMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), searchPattern);
                Predicate brandMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("brand")), searchPattern);
                Predicate descMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), searchPattern);
                predicates.add(criteriaBuilder.or(nameMatch, brandMatch, descMatch));
            }

            // 3. Category matching (supports numeric ID, slug, or category name)
            if (categoryId != null && categoryId > 0) {
                predicates.add(criteriaBuilder.equal(root.get("category").get("id"), categoryId));
            } else if (category != null && !category.trim().isEmpty()) {
                String catTrimmed = category.trim();
                // Check if numeric string
                try {
                    long parsedId = Long.parseLong(catTrimmed);
                    predicates.add(criteriaBuilder.equal(root.get("category").get("id"), parsedId));
                } catch (NumberFormatException ignored) {
                    // Match slug or name case-insensitively
                    Join<Product, Category> categoryJoin = root.join("category", JoinType.INNER);
                    String catLower = catTrimmed.toLowerCase();
                    Predicate slugMatch = criteriaBuilder.equal(criteriaBuilder.lower(categoryJoin.get("slug")), catLower);
                    Predicate nameMatch = criteriaBuilder.equal(criteriaBuilder.lower(categoryJoin.get("name")), catLower);
                    Predicate nameLike = criteriaBuilder.like(criteriaBuilder.lower(categoryJoin.get("name")), "%" + catLower + "%");
                    predicates.add(criteriaBuilder.or(slugMatch, nameMatch, nameLike));
                }
            }

            // 4. Brand matching (supports single or comma-separated list of brands)
            if (brand != null && !brand.trim().isEmpty()) {
                String[] brandArray = brand.split(",");
                List<String> brandList = Arrays.stream(brandArray)
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(String::toLowerCase)
                        .toList();

                if (!brandList.isEmpty()) {
                    if (brandList.size() == 1) {
                        predicates.add(criteriaBuilder.equal(
                                criteriaBuilder.lower(root.get("brand")),
                                brandList.get(0)
                        ));
                    } else {
                        predicates.add(criteriaBuilder.lower(root.get("brand")).in(brandList));
                    }
                }
            }

            // 5. Minimum price filter
            if (minPrice != null && minPrice.compareTo(BigDecimal.ZERO) >= 0) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("price"), minPrice));
            }

            // 6. Maximum price filter
            if (maxPrice != null && maxPrice.compareTo(BigDecimal.ZERO) > 0) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            // 7. Rating threshold filter (minimum customer rating)
            if (minRating != null && minRating > 0.0) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("rating"), minRating));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
