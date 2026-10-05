package com.shopsphere.controller;

import com.shopsphere.dto.request.CartItemRequestDto;
import com.shopsphere.dto.request.CartItemUpdateRequestDto;
import com.shopsphere.dto.response.ApiResponse;
import com.shopsphere.dto.response.CartResponseDto;
import com.shopsphere.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    /**
     * Get current user's shopping cart.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<CartResponseDto>> getCart(Authentication authentication) {
        String email = authentication.getName();
        CartResponseDto cart = cartService.getCart(email);
        return ResponseEntity.ok(ApiResponse.success("Cart retrieved successfully", cart));
    }

    /**
     * Add product to cart with server-side price and stock validation.
     */
    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponseDto>> addItem(
            Authentication authentication,
            @Valid @RequestBody CartItemRequestDto request
    ) {
        String email = authentication.getName();
        CartResponseDto cart = cartService.addItem(email, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Item added to cart successfully", cart));
    }

    /**
     * Update cart item quantity with stock validation.
     */
    @PutMapping("/items/{id}")
    public ResponseEntity<ApiResponse<CartResponseDto>> updateItem(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CartItemUpdateRequestDto request
    ) {
        String email = authentication.getName();
        CartResponseDto cart = cartService.updateItemQuantity(email, id, request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success("Cart item updated successfully", cart));
    }

    /**
     * Remove item from cart.
     */
    @DeleteMapping("/items/{id}")
    public ResponseEntity<ApiResponse<CartResponseDto>> removeItem(
            Authentication authentication,
            @PathVariable Long id
    ) {
        String email = authentication.getName();
        CartResponseDto cart = cartService.removeItem(email, id);
        return ResponseEntity.ok(ApiResponse.success("Item removed from cart successfully", cart));
    }

    /**
     * Clear all items from cart.
     */
    @DeleteMapping
    public ResponseEntity<ApiResponse<CartResponseDto>> clearCart(Authentication authentication) {
        String email = authentication.getName();
        CartResponseDto cart = cartService.clearCart(email);
        return ResponseEntity.ok(ApiResponse.success("Cart cleared successfully", cart));
    }
}
