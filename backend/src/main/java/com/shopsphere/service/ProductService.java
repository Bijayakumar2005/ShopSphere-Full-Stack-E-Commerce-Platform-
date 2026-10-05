package com.shopsphere.service;

import com.shopsphere.dto.request.ProductCreateRequestDto;
import com.shopsphere.dto.request.ProductUpdateRequestDto;
import com.shopsphere.dto.response.PagedResponse;
import com.shopsphere.dto.response.ProductResponseDto;

import java.math.BigDecimal;

public interface ProductService {

    PagedResponse<ProductResponseDto> getProducts(
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
    );

    default PagedResponse<ProductResponseDto> getProducts(
            String keyword,
            Long categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {
        return getProducts(keyword, null, categoryId, null, minPrice, maxPrice, null, null, page, size, sortBy, sortDir);
    }

    ProductResponseDto getProductById(Long id);

    ProductResponseDto createProduct(ProductCreateRequestDto request);

    ProductResponseDto updateProduct(Long id, ProductUpdateRequestDto request);

    ProductResponseDto updateStock(Long id, Integer stockQuantity);

    ProductResponseDto updatePrice(Long id, BigDecimal price, BigDecimal originalPrice);

    void deleteProduct(Long id);
}
