package com.shopsphere.service.impl;

import com.shopsphere.dto.request.CartItemRequestDto;
import com.shopsphere.dto.response.CartResponseDto;
import com.shopsphere.entity.Cart;
import com.shopsphere.entity.CartItem;
import com.shopsphere.entity.Product;
import com.shopsphere.entity.User;
import com.shopsphere.exception.BadRequestException;
import com.shopsphere.exception.ResourceNotFoundException;
import com.shopsphere.repository.CartItemRepository;
import com.shopsphere.repository.CartRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.repository.UserRepository;
import com.shopsphere.service.CartService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartServiceImpl(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductRepository productRepository,
            UserRepository userRepository
    ) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private Cart getOrCreateCart(User user) {
        return cartRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Cart newCart = new Cart(user);
                    return cartRepository.save(newCart);
                });
    }

    @Override
    @Transactional
    public CartResponseDto getCart(String userEmail) {
        User user = getAuthenticatedUser(userEmail);
        Cart cart = getOrCreateCart(user);
        return CartResponseDto.fromEntity(cart);
    }

    @Override
    @Transactional
    public CartResponseDto addItem(String userEmail, CartItemRequestDto request) {
        if (request.getQuantity() == null || request.getQuantity() < 1) {
            throw new BadRequestException("Quantity must be at least 1.");
        }

        User user = getAuthenticatedUser(userEmail);
        Cart cart = getOrCreateCart(user);

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        if (!product.isActive()) {
            throw new BadRequestException("Product \"" + product.getName() + "\" is not available for purchase.");
        }

        int availableStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        if (availableStock < 1) {
            throw new BadRequestException("Product \"" + product.getName() + "\" is currently out of stock.");
        }

        Optional<CartItem> existingItemOpt = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(product.getId()))
                .findFirst();

        if (existingItemOpt.isPresent()) {
            CartItem existing = existingItemOpt.get();
            int newQuantity = existing.getQuantity() + request.getQuantity();
            if (newQuantity > availableStock) {
                throw new BadRequestException("Cannot add " + request.getQuantity() + " more units. Total requested (" +
                        newQuantity + ") exceeds available stock of " + availableStock + ".");
            }
            existing.setQuantity(newQuantity);
        } else {
            if (request.getQuantity() > availableStock) {
                throw new BadRequestException("Requested quantity (" + request.getQuantity() +
                        ") exceeds available stock of " + availableStock + ".");
            }
            CartItem newItem = new CartItem(cart, product, request.getQuantity());
            cart.addItem(newItem);
        }

        Cart saved = cartRepository.save(cart);
        return CartResponseDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public CartResponseDto updateItemQuantity(String userEmail, Long itemId, int quantity) {
        if (quantity < 1) {
            throw new BadRequestException("Quantity must be at least 1. Use remove item to delete.");
        }

        User user = getAuthenticatedUser(userEmail);
        Cart cart = getOrCreateCart(user);

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", itemId));

        Product product = item.getProduct();
        int availableStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;

        if (quantity > availableStock) {
            throw new BadRequestException("Requested quantity (" + quantity +
                    ") exceeds available stock of " + availableStock + ".");
        }

        item.setQuantity(quantity);
        Cart saved = cartRepository.save(cart);
        return CartResponseDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public CartResponseDto removeItem(String userEmail, Long itemId) {
        User user = getAuthenticatedUser(userEmail);
        Cart cart = getOrCreateCart(user);

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", itemId));

        cart.removeItem(item);
        Cart saved = cartRepository.save(cart);
        return CartResponseDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public CartResponseDto clearCart(String userEmail) {
        User user = getAuthenticatedUser(userEmail);
        Cart cart = getOrCreateCart(user);

        cart.clear();
        Cart saved = cartRepository.save(cart);
        return CartResponseDto.fromEntity(saved);
    }
}
