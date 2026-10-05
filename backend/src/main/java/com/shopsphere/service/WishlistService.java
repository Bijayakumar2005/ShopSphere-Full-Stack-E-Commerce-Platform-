package com.shopsphere.service;

import com.shopsphere.dto.response.WishlistResponseDto;

public interface WishlistService {

    WishlistResponseDto getWishlist(String userEmail);

    WishlistResponseDto addToWishlist(String userEmail, Long productId);

    WishlistResponseDto removeFromWishlist(String userEmail, Long productId);

    WishlistResponseDto moveToCart(String userEmail, Long productId);
}
