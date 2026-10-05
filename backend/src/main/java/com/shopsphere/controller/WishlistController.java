package com.shopsphere.controller;

import com.shopsphere.dto.response.ApiResponse;
import com.shopsphere.dto.response.WishlistResponseDto;
import com.shopsphere.service.WishlistService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wishlist")
@PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    /**
     * Get current user's wishlist.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<WishlistResponseDto>> getWishlist(Authentication authentication) {
        String email = authentication.getName();
        WishlistResponseDto wishlist = wishlistService.getWishlist(email);
        return ResponseEntity.ok(ApiResponse.success("Wishlist retrieved successfully", wishlist));
    }

    /**
     * Add product to wishlist (preventing duplicate entries).
     */
    @PostMapping("/{productId}")
    public ResponseEntity<ApiResponse<WishlistResponseDto>> addToWishlist(
            Authentication authentication,
            @PathVariable Long productId
    ) {
        String email = authentication.getName();
        WishlistResponseDto wishlist = wishlistService.addToWishlist(email, productId);
        return ResponseEntity.ok(ApiResponse.success("Product added to wishlist successfully", wishlist));
    }

    /**
     * Remove product from wishlist.
     */
    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<WishlistResponseDto>> removeFromWishlist(
            Authentication authentication,
            @PathVariable Long productId
    ) {
        String email = authentication.getName();
        WishlistResponseDto wishlist = wishlistService.removeFromWishlist(email, productId);
        return ResponseEntity.ok(ApiResponse.success("Product removed from wishlist successfully", wishlist));
    }

    /**
     * Move product from wishlist into cart.
     */
    @PostMapping("/{productId}/move-to-cart")
    public ResponseEntity<ApiResponse<WishlistResponseDto>> moveToCart(
            Authentication authentication,
            @PathVariable Long productId
    ) {
        String email = authentication.getName();
        WishlistResponseDto wishlist = wishlistService.moveToCart(email, productId);
        return ResponseEntity.ok(ApiResponse.success("Product moved to cart successfully", wishlist));
    }
}
