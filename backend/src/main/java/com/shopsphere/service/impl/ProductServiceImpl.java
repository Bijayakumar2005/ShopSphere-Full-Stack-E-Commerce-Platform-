package com.shopsphere.service.impl;

import com.shopsphere.dto.request.ProductCreateRequestDto;
import com.shopsphere.dto.request.ProductUpdateRequestDto;
import com.shopsphere.dto.response.PagedResponse;
import com.shopsphere.dto.response.ProductResponseDto;
import com.shopsphere.entity.Category;
import com.shopsphere.entity.Product;
import com.shopsphere.exception.ResourceNotFoundException;
import com.shopsphere.repository.CategoryRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.repository.specification.ProductSpecification;
import com.shopsphere.service.ProductService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ProductServiceImpl implements ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductServiceImpl.class);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductServiceImpl(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ProductResponseDto> getProducts(
            String keyword,
            String category,
            Long categoryId,
            String brand,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Double rating,
            String sort,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 100);

        Sort sortOrder = parseSort(sort, sortBy, sortDir);
        Pageable pageable = PageRequest.of(safePage, safeSize, sortOrder);

        Specification<Product> spec = ProductSpecification.filter(
                keyword,
                category,
                categoryId,
                brand,
                minPrice,
                maxPrice,
                rating
        );

        Page<Product> productPage = productRepository.findAll(spec, pageable);

        List<ProductResponseDto> dtos = productPage.getContent()
                .stream()
                .map(ProductResponseDto::fromEntity)
                .toList();

        return PagedResponse.of(productPage, dtos);
    }

    private Sort parseSort(String sortParam, String sortBy, String sortDir) {
        if (sortParam != null && !sortParam.trim().isEmpty()) {
            String s = sortParam.trim().toLowerCase();
            return switch (s) {
                case "priceasc", "price:asc", "price,asc", "price-asc" -> Sort.by("price").ascending();
                case "pricedesc", "price:desc", "price,desc", "price-desc" -> Sort.by("price").descending();
                case "rating", "ratingdesc", "rating:desc", "rating,desc", "rating-desc" -> Sort.by("rating").descending().and(Sort.by("id").descending());
                case "newest", "createdatdesc", "createdat:desc", "createdat,desc", "createdat-desc" -> Sort.by("createdAt").descending();
                case "nameasc", "name:asc", "name,asc", "name-asc" -> Sort.by("name").ascending();
                case "namedesc", "name:desc", "name,desc", "name-desc" -> Sort.by("name").descending();
                case "featured" -> Sort.by("id").ascending();
                default -> Sort.by("id").ascending();
            };
        }

        String safeSortBy = "id";
        if ("name".equalsIgnoreCase(sortBy) || "price".equalsIgnoreCase(sortBy) ||
            "rating".equalsIgnoreCase(sortBy) || "createdAt".equalsIgnoreCase(sortBy)) {
            safeSortBy = sortBy;
        }

        return "desc".equalsIgnoreCase(sortDir)
                ? Sort.by(safeSortBy).descending()
                : Sort.by(safeSortBy).ascending();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponseDto getProductById(Long id) {
        Product product = productRepository.findById(id)
                .filter(Product::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return ProductResponseDto.fromEntity(product);
    }

    @Override
    @Transactional
    public ProductResponseDto createProduct(ProductCreateRequestDto request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        Product product = new Product();
        product.setName(request.getName());
        product.setBrand(request.getBrand());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setOriginalPrice(request.getOriginalPrice() != null ? request.getOriginalPrice() : request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setCategory(category);
        product.setImageUrl(request.getImageUrl());
        product.setEmoji(request.getEmoji() != null ? request.getEmoji() : "📦");
        product.setAccent(request.getAccent() != null ? request.getAccent() : "#6366f1");
        product.setActive(true);
        product.setRating(0.0);
        product.setReviewCount(0);

        Product saved = productRepository.save(product);
        log.info("Created new product ID: {} ({}) in category ID: {}", saved.getId(), saved.getName(), category.getId());
        return ProductResponseDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public ProductResponseDto updateProduct(Long id, ProductUpdateRequestDto request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        if (request.getName() != null) {
            product.setName(request.getName());
        }
        if (request.getBrand() != null) {
            product.setBrand(request.getBrand());
        }
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }
        if (request.getPrice() != null) {
            product.setPrice(request.getPrice());
        }
        if (request.getOriginalPrice() != null) {
            product.setOriginalPrice(request.getOriginalPrice());
        }
        if (request.getStockQuantity() != null) {
            product.setStockQuantity(request.getStockQuantity());
        }
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
            product.setCategory(category);
        }
        if (request.getImageUrl() != null) {
            product.setImageUrl(request.getImageUrl());
        }
        if (request.getEmoji() != null) {
            product.setEmoji(request.getEmoji());
        }
        if (request.getAccent() != null) {
            product.setAccent(request.getAccent());
        }
        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }

        Product updated = productRepository.save(product);
        log.info("Updated product ID: {}", updated.getId());
        return ProductResponseDto.fromEntity(updated);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        // Soft delete to maintain relational integrity with existing order/cart records
        product.setActive(false);
        productRepository.save(product);
        log.info("Soft deleted product ID: {}", id);
    }

    @Override
    @Transactional
    public ProductResponseDto updateStock(Long id, Integer stockQuantity) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        product.setStockQuantity(stockQuantity);
        Product saved = productRepository.save(product);
        log.info("Updated stock for product ID: {} to {}", id, stockQuantity);
        return ProductResponseDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public ProductResponseDto updatePrice(Long id, BigDecimal price, BigDecimal originalPrice) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        product.setPrice(price);
        if (originalPrice != null) {
            product.setOriginalPrice(originalPrice);
        }
        Product saved = productRepository.save(product);
        log.info("Updated price for product ID: {} to {}", id, price);
        return ProductResponseDto.fromEntity(saved);
    }
}
