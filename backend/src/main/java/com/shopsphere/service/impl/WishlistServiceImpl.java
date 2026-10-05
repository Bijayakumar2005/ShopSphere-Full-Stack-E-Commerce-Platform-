package com.shopsphere.service.impl;

import com.shopsphere.dto.request.CartItemRequestDto;
import com.shopsphere.dto.response.WishlistResponseDto;
import com.shopsphere.entity.Product;
import com.shopsphere.entity.User;
import com.shopsphere.entity.Wishlist;
import com.shopsphere.entity.WishlistItem;
import com.shopsphere.exception.ResourceNotFoundException;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.repository.UserRepository;
import com.shopsphere.repository.WishlistItemRepository;
import com.shopsphere.repository.WishlistRepository;
import com.shopsphere.service.CartService;
import com.shopsphere.service.WishlistService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class WishlistServiceImpl implements WishlistService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final WishlistRepository wishlistRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final CartService cartService;

    public WishlistServiceImpl(UserRepository userRepository,
                               ProductRepository productRepository,
                               WishlistRepository wishlistRepository,
                               WishlistItemRepository wishlistItemRepository,
                               CartService cartService) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.wishlistRepository = wishlistRepository;
        this.wishlistItemRepository = wishlistItemRepository;
        this.cartService = cartService;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private Wishlist getOrCreateWishlist(User user) {
        return wishlistRepository.findByUserId(user.getId())
                .orElseGet(() -> wishlistRepository.save(new Wishlist(user)));
    }

    @Override
    @Transactional(readOnly = true)
    public WishlistResponseDto getWishlist(String userEmail) {
        User user = getUserByEmail(userEmail);
        Wishlist wishlist = getOrCreateWishlist(user);
        return WishlistResponseDto.fromEntity(wishlist);
    }

    @Override
    public WishlistResponseDto addToWishlist(String userEmail, Long productId) {
        User user = getUserByEmail(userEmail);
        Wishlist wishlist = getOrCreateWishlist(user);

        Product product = productRepository.findById(productId)
                .filter(Product::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        // Prevent duplicate wishlist entries
        boolean exists = wishlistItemRepository.existsByWishlistIdAndProductId(wishlist.getId(), productId);
        if (!exists) {
            WishlistItem item = new WishlistItem(wishlist, product);
            wishlist.addItem(item);
            wishlistRepository.save(wishlist);
        }

        return WishlistResponseDto.fromEntity(wishlist);
    }

    @Override
    public WishlistResponseDto removeFromWishlist(String userEmail, Long productId) {
        User user = getUserByEmail(userEmail);
        Wishlist wishlist = getOrCreateWishlist(user);

        wishlistItemRepository.findByWishlistIdAndProductId(wishlist.getId(), productId)
                .ifPresent(item -> {
                    wishlist.removeItem(item);
                    wishlistItemRepository.delete(item);
                });

        return WishlistResponseDto.fromEntity(wishlist);
    }

    @Override
    public WishlistResponseDto moveToCart(String userEmail, Long productId) {
        // 1. Add 1 quantity to customer cart (validates product and stock)
        CartItemRequestDto cartRequest = new CartItemRequestDto(productId, 1);
        cartService.addItem(userEmail, cartRequest);

        // 2. Remove product from customer wishlist
        return removeFromWishlist(userEmail, productId);
    }
}
