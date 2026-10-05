package com.shopsphere.controller;

import com.shopsphere.dto.request.ProductCreateRequestDto;
import com.shopsphere.dto.request.ProductUpdateRequestDto;
import com.shopsphere.dto.response.ApiResponse;
import com.shopsphere.dto.response.PagedResponse;
import com.shopsphere.dto.response.ProductResponseDto;
import com.shopsphere.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    /**
     * Customer / Public endpoint: Get paginated list of products with production-grade search, filtering, and sorting.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ProductResponseDto>>> getProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Double rating,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        PagedResponse<ProductResponseDto> response = productService.getProducts(
                keyword, category, categoryId, brand, minPrice, maxPrice, rating, sort, page, size, sortBy, sortDir
        );
        return ResponseEntity.ok(ApiResponse.success("Products fetched successfully", response));
    }

    /**
     * Customer / Public endpoint: Get product details by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponseDto>> getProductById(@PathVariable Long id) {
        ProductResponseDto product = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success("Product fetched successfully", product));
    }

    /**
     * Admin-only endpoint: Create a new product.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponseDto>> createProduct(
            @Valid @RequestBody ProductCreateRequestDto request
    ) {
        ProductResponseDto created = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product created successfully", created));
    }

    /**
     * Admin-only endpoint: Update an existing product.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponseDto>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductUpdateRequestDto request
    ) {
        ProductResponseDto updated = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success("Product updated successfully", updated));
    }

    /**
     * Admin-only endpoint: Delete (soft delete) a product.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.message("Product deleted successfully"));
    }

    /**
     * Admin-only endpoint: Quick stock update.
     */
    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponseDto>> updateProductStock(
            @PathVariable Long id,
            @Valid @RequestBody com.shopsphere.dto.request.StockUpdateRequestDto request
    ) {
        ProductResponseDto updated = productService.updateStock(id, request.getStockQuantity());
        return ResponseEntity.ok(ApiResponse.success("Stock updated successfully", updated));
    }

    /**
     * Admin-only endpoint: Quick price and discount update.
     */
    @PatchMapping("/{id}/price")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponseDto>> updateProductPrice(
            @PathVariable Long id,
            @Valid @RequestBody com.shopsphere.dto.request.PriceUpdateRequestDto request
    ) {
        ProductResponseDto updated = productService.updatePrice(id, request.getPrice(), request.getOriginalPrice());
        return ResponseEntity.ok(ApiResponse.success("Price updated successfully", updated));
    }
}
