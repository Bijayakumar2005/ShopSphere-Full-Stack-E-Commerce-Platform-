package com.shopsphere.service;

import com.shopsphere.dto.request.ProductCreateRequestDto;
import com.shopsphere.dto.response.PagedResponse;
import com.shopsphere.dto.response.ProductResponseDto;
import com.shopsphere.entity.Category;
import com.shopsphere.entity.Product;
import com.shopsphere.exception.ResourceNotFoundException;
import com.shopsphere.repository.CategoryRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.service.impl.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    private Category sampleCategory;
    private Product sampleProduct;

    @BeforeEach
    void setUp() {
        sampleCategory = new Category("Electronics", "electronics", "💻", "Gadgets and tech");
        sampleCategory.setId(1L);

        sampleProduct = new Product();
        sampleProduct.setId(10L);
        sampleProduct.setName("Wireless Noise-Canceling Headphones");
        sampleProduct.setBrand("AudioMax");
        sampleProduct.setCategory(sampleCategory);
        sampleProduct.setPrice(BigDecimal.valueOf(199.99));
        sampleProduct.setOriginalPrice(BigDecimal.valueOf(249.99));
        sampleProduct.setStockQuantity(50);
        sampleProduct.setRating(4.8);
        sampleProduct.setReviewCount(120);
        sampleProduct.setActive(true);
    }

    @Test
    @DisplayName("getProductById: Returns product DTO when product exists and is active")
    void getProductById_Success() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));

        ProductResponseDto dto = productService.getProductById(10L);

        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isEqualTo(10L);
        assertThat(dto.getName()).isEqualTo("Wireless Noise-Canceling Headphones");
        assertThat(dto.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(199.99));
        assertThat(dto.getCategory().getName()).isEqualTo("Electronics");

        verify(productRepository).findById(10L);
    }

    @Test
    @DisplayName("getProductById: Throws ResourceNotFoundException when product does not exist")
    void getProductById_NotFound_ThrowsException() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.getProductById(999L));
        verify(productRepository).findById(999L);
    }

    @Test
    @DisplayName("getProductById: Throws ResourceNotFoundException when product is deactivated")
    void getProductById_Inactive_ThrowsException() {
        sampleProduct.setActive(false);
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));

        assertThrows(ResourceNotFoundException.class, () -> productService.getProductById(10L));
    }

    @Test
    @DisplayName("getProducts: Returns paged response matching specifications and sort")
    void getProducts_WithFiltersAndPagination_ReturnsPagedResponse() {
        Page<Product> page = new PageImpl<>(List.of(sampleProduct));
        when(productRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PagedResponse<ProductResponseDto> response = productService.getProducts(
                "Headphones",
                "Electronics",
                1L,
                "AudioMax",
                BigDecimal.valueOf(100),
                BigDecimal.valueOf(300),
                4.0,
                "price:asc",
                0,
                10,
                "price",
                "asc"
        );

        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getName()).isEqualTo("Wireless Noise-Canceling Headphones");
        assertThat(response.getTotalElements()).isEqualTo(1);
        assertThat(response.getTotalPages()).isEqualTo(1);

        verify(productRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    @DisplayName("createProduct: Successfully creates and returns product when category exists")
    void createProduct_Success() {
        ProductCreateRequestDto request = new ProductCreateRequestDto();
        request.setName("Mechanical Keyboard");
        request.setBrand("KeyMaster");
        request.setCategoryId(1L);
        request.setPrice(BigDecimal.valueOf(89.99));
        request.setOriginalPrice(BigDecimal.valueOf(109.99));
        request.setStockQuantity(30);
        request.setDescription("RGB Backlit keyboard");

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product p = invocation.getArgument(0);
            p.setId(15L);
            return p;
        });

        ProductResponseDto result = productService.createProduct(request);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(15L);
        assertThat(result.getName()).isEqualTo("Mechanical Keyboard");
        assertThat(result.getStockQuantity()).isEqualTo(30);

        verify(categoryRepository).findById(1L);
        verify(productRepository).save(any(Product.class));
    }

    @Test
    @DisplayName("createProduct: Throws ResourceNotFoundException when category not found")
    void createProduct_CategoryNotFound_ThrowsException() {
        ProductCreateRequestDto request = new ProductCreateRequestDto();
        request.setName("Unknown Category Product");
        request.setBrand("Brand");
        request.setCategoryId(999L);
        request.setPrice(BigDecimal.valueOf(49.99));
        request.setStockQuantity(10);

        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.createProduct(request));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    @DisplayName("updateStock: Successfully updates stock quantity")
    void updateStock_Success() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProductResponseDto updated = productService.updateStock(10L, 75);

        assertThat(updated.getStockQuantity()).isEqualTo(75);
        verify(productRepository).save(argThat(p -> p.getStockQuantity() == 75));
    }

    @Test
    @DisplayName("updatePrice: Successfully updates price and original price")
    void updatePrice_Success() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProductResponseDto updated = productService.updatePrice(
                10L,
                BigDecimal.valueOf(179.99),
                BigDecimal.valueOf(249.99)
        );

        assertThat(updated.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(179.99));
        assertThat(updated.getOriginalPrice()).isEqualByComparingTo(BigDecimal.valueOf(249.99));

        verify(productRepository).save(argThat(p ->
                p.getPrice().compareTo(BigDecimal.valueOf(179.99)) == 0 &&
                p.getOriginalPrice().compareTo(BigDecimal.valueOf(249.99)) == 0
        ));
    }

    @Test
    @DisplayName("deleteProduct: Soft-deletes product setting active to false")
    void deleteProduct_SoftDeletesProduct() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        productService.deleteProduct(10L);

        verify(productRepository).save(argThat(p -> !p.isActive()));
    }
}
