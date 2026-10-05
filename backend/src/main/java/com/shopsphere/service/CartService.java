package com.shopsphere.service;

import com.shopsphere.dto.request.CartItemRequestDto;
import com.shopsphere.dto.response.CartResponseDto;

public interface CartService {

    CartResponseDto getCart(String userEmail);

    CartResponseDto addItem(String userEmail, CartItemRequestDto request);

    CartResponseDto updateItemQuantity(String userEmail, Long itemId, int quantity);

    CartResponseDto removeItem(String userEmail, Long itemId);

    CartResponseDto clearCart(String userEmail);
}
