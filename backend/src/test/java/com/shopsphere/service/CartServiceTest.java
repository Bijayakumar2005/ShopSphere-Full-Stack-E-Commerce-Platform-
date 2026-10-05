package com.shopsphere.service;

import com.shopsphere.dto.request.CartItemRequestDto;
import com.shopsphere.dto.response.CartResponseDto;
import com.shopsphere.entity.Cart;
import com.shopsphere.entity.CartItem;
import com.shopsphere.entity.Product;
import com.shopsphere.entity.User;
import com.shopsphere.entity.enums.Role;
import com.shopsphere.exception.BadRequestException;
import com.shopsphere.repository.CartItemRepository;
import com.shopsphere.repository.CartRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.repository.UserRepository;
import com.shopsphere.service.impl.CartServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CartServiceImpl cartService;

    private User sampleUser;
    private Cart sampleCart;
    private Product productInStock;
    private Product productLowStock;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setEmail("shopper@example.com");
        sampleUser.setName("Shopper One");
        sampleUser.setRole(Role.CUSTOMER);
        sampleUser.setActive(true);

        sampleCart = new Cart(sampleUser);
        sampleCart.setId(100L);

        productInStock = new Product();
        productInStock.setId(10L);
        productInStock.setName("Smart Fitness Watch");
        productInStock.setPrice(BigDecimal.valueOf(199.00));
        productInStock.setOriginalPrice(BigDecimal.valueOf(249.00));
        productInStock.setStockQuantity(20);
        productInStock.setActive(true);

        productLowStock = new Product();
        productLowStock.setId(20L);
        productLowStock.setName("Limited Edition Cap");
        productLowStock.setPrice(BigDecimal.valueOf(49.00));
        productLowStock.setStockQuantity(2);
        productLowStock.setActive(true);
    }

    @Test
    @DisplayName("addItem: Successfully adds product when quantity is within available stock")
    void addItem_WithinStock_Success() {
        when(userRepository.findByEmail("shopper@example.com")).thenReturn(Optional.of(sampleUser));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(sampleCart));
        when(productRepository.findById(10L)).thenReturn(Optional.of(productInStock));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CartItemRequestDto request = new CartItemRequestDto(10L, 3);
        CartResponseDto response = cartService.addItem("shopper@example.com", request);

        assertThat(response).isNotNull();
        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getProductId()).isEqualTo(10L);
        assertThat(response.getItems().get(0).getQuantity()).isEqualTo(3);
        // Subtotal: 199.00 * 3 = 597.00 (< 999 -> shipping fee 99)
        assertThat(response.getSubtotal()).isEqualByComparingTo(BigDecimal.valueOf(597.00));
        assertThat(response.getShipping()).isEqualByComparingTo(BigDecimal.valueOf(99.00));
        assertThat(response.getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(696.00));

        verify(cartRepository).save(sampleCart);
    }

    @Test
    @DisplayName("addItem: Throws BadRequestException when requested quantity exceeds available stock")
    void addItem_ExceedsStock_ThrowsBadRequestException() {
        when(userRepository.findByEmail("shopper@example.com")).thenReturn(Optional.of(sampleUser));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(sampleCart));
        when(productRepository.findById(20L)).thenReturn(Optional.of(productLowStock)); // stock = 2

        CartItemRequestDto request = new CartItemRequestDto(20L, 5); // requesting 5

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> cartService.addItem("shopper@example.com", request));

        assertThat(ex.getMessage()).contains("exceeds available stock");
        verify(cartRepository, never()).save(any(Cart.class));
    }

    @Test
    @DisplayName("addItem: Throws BadRequestException when cumulative quantity exceeds available stock")
    void addItem_CumulativeExceedsStock_ThrowsBadRequestException() {
        // Pre-populate cart with 2 units of productLowStock (stock = 2)
        CartItem existingItem = new CartItem(sampleCart, productLowStock, 2);
        sampleCart.getItems().add(existingItem);

        when(userRepository.findByEmail("shopper@example.com")).thenReturn(Optional.of(sampleUser));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(sampleCart));
        when(productRepository.findById(20L)).thenReturn(Optional.of(productLowStock));

        CartItemRequestDto request = new CartItemRequestDto(20L, 1); // 2 + 1 = 3 > 2

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> cartService.addItem("shopper@example.com", request));

        assertThat(ex.getMessage()).contains("exceeds available stock");
    }

    @Test
    @DisplayName("addItem: Rejects out of stock product (stock = 0)")
    void addItem_OutOfStock_ThrowsBadRequestException() {
        productLowStock.setStockQuantity(0);

        when(userRepository.findByEmail("shopper@example.com")).thenReturn(Optional.of(sampleUser));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(sampleCart));
        when(productRepository.findById(20L)).thenReturn(Optional.of(productLowStock));

        CartItemRequestDto request = new CartItemRequestDto(20L, 1);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> cartService.addItem("shopper@example.com", request));

        assertThat(ex.getMessage()).contains("currently out of stock");
    }

    @Test
    @DisplayName("addItem: Rejects inactive product")
    void addItem_InactiveProduct_ThrowsBadRequestException() {
        productInStock.setActive(false);

        when(userRepository.findByEmail("shopper@example.com")).thenReturn(Optional.of(sampleUser));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(sampleCart));
        when(productRepository.findById(10L)).thenReturn(Optional.of(productInStock));

        CartItemRequestDto request = new CartItemRequestDto(10L, 1);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> cartService.addItem("shopper@example.com", request));

        assertThat(ex.getMessage()).contains("not available for purchase");
    }

    @Test
    @DisplayName("addItem: Rejects quantity less than 1")
    void addItem_InvalidQuantity_ThrowsBadRequestException() {
        CartItemRequestDto request = new CartItemRequestDto(10L, 0);

        assertThrows(BadRequestException.class, () -> cartService.addItem("shopper@example.com", request));
    }

    @Test
    @DisplayName("cart totals: Free shipping threshold applied when subtotal >= 999")
    void cartTotals_FreeShippingThresholdApplied() {
        // 6 units of $199 = 1194.00 (>= 999 -> free shipping)
        CartItem item = new CartItem(sampleCart, productInStock, 6);
        sampleCart.getItems().add(item);

        when(userRepository.findByEmail("shopper@example.com")).thenReturn(Optional.of(sampleUser));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(sampleCart));

        CartResponseDto response = cartService.getCart("shopper@example.com");

        assertThat(response.getSubtotal()).isEqualByComparingTo(BigDecimal.valueOf(1194.00));
        assertThat(response.getShipping()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(1194.00));
        // Discount per item: 249 - 199 = 50 * 6 = 300
        assertThat(response.getDiscount()).isEqualByComparingTo(BigDecimal.valueOf(300.00));
    }

    @Test
    @DisplayName("updateItemQuantity: Updates quantity and recalculates totals")
    void updateItemQuantity_Success() {
        CartItem item = new CartItem(sampleCart, productInStock, 2);
        item.setId(55L);
        sampleCart.getItems().add(item);

        when(userRepository.findByEmail("shopper@example.com")).thenReturn(Optional.of(sampleUser));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(sampleCart));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CartResponseDto response = cartService.updateItemQuantity("shopper@example.com", 55L, 5);

        assertThat(response.getItems().get(0).getQuantity()).isEqualTo(5);
        assertThat(response.getSubtotal()).isEqualByComparingTo(BigDecimal.valueOf(995.00));
        verify(cartRepository).save(sampleCart);
    }

    @Test
    @DisplayName("updateItemQuantity: Rejects quantity less than 1 with BadRequestException")
    void updateItemQuantity_ZeroOrNegative_ThrowsBadRequestException() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> cartService.updateItemQuantity("shopper@example.com", 55L, 0));

        assertThat(ex.getMessage()).contains("Quantity must be at least 1");
    }

    @Test
    @DisplayName("removeItem: Removes item and recalculates totals")
    void removeItem_Success() {
        CartItem item = new CartItem(sampleCart, productInStock, 2);
        item.setId(55L);
        sampleCart.getItems().add(item);

        when(userRepository.findByEmail("shopper@example.com")).thenReturn(Optional.of(sampleUser));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(sampleCart));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CartResponseDto response = cartService.removeItem("shopper@example.com", 55L);

        assertThat(response.getItems()).isEmpty();
        verify(cartRepository).save(sampleCart);
    }

    @Test
    @DisplayName("clearCart: Empties all items from cart")
    void clearCart_Success() {
        CartItem item = new CartItem(sampleCart, productInStock, 2);
        sampleCart.getItems().add(item);

        when(userRepository.findByEmail("shopper@example.com")).thenReturn(Optional.of(sampleUser));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(sampleCart));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CartResponseDto response = cartService.clearCart("shopper@example.com");

        assertThat(response.getItems()).isEmpty();
        assertThat(response.getTotalItems()).isEqualTo(0);
        assertThat(response.getTotalAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
