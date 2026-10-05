package com.shopsphere.dto.response;

import com.shopsphere.entity.Cart;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class CartResponseDto {

    private Long id;
    private Long userId;
    private List<CartItemResponseDto> items = new ArrayList<>();
    private Integer totalItems = 0;
    private BigDecimal subtotal = BigDecimal.ZERO;
    private BigDecimal discount = BigDecimal.ZERO;
    private BigDecimal shipping = BigDecimal.ZERO;
    private BigDecimal totalAmount = BigDecimal.ZERO;

    public CartResponseDto() {
    }

    public static CartResponseDto fromEntity(Cart cart) {
        if (cart == null) return null;
        CartResponseDto dto = new CartResponseDto();
        dto.setId(cart.getId());
        if (cart.getUser() != null) {
            dto.setUserId(cart.getUser().getId());
        }

        BigDecimal calculatedSubtotal = BigDecimal.ZERO;
        BigDecimal calculatedDiscount = BigDecimal.ZERO;
        int count = 0;

        if (cart.getItems() != null) {
            for (var item : cart.getItems()) {
                CartItemResponseDto itemDto = CartItemResponseDto.fromEntity(item);
                dto.getItems().add(itemDto);

                if (itemDto.getSubtotal() != null) {
                    calculatedSubtotal = calculatedSubtotal.add(itemDto.getSubtotal());
                }
                if (itemDto.getDiscountAmount() != null) {
                    calculatedDiscount = calculatedDiscount.add(itemDto.getDiscountAmount());
                }
                count += item.getQuantity();
            }
        }

        dto.setTotalItems(count);
        dto.setSubtotal(calculatedSubtotal);
        dto.setDiscount(calculatedDiscount);

        // Free delivery over 999 (or if cart is empty, 0)
        BigDecimal shippingFee = BigDecimal.ZERO;
        if (calculatedSubtotal.compareTo(BigDecimal.ZERO) > 0 && calculatedSubtotal.compareTo(BigDecimal.valueOf(999)) < 0) {
            shippingFee = BigDecimal.valueOf(99);
        }
        dto.setShipping(shippingFee);
        dto.setTotalAmount(calculatedSubtotal.add(shippingFee));

        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public List<CartItemResponseDto> getItems() {
        return items;
    }

    public void setItems(List<CartItemResponseDto> items) {
        this.items = items;
    }

    public Integer getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(Integer totalItems) {
        this.totalItems = totalItems;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getDiscount() {
        return discount;
    }

    public void setDiscount(BigDecimal discount) {
        this.discount = discount;
    }

    public BigDecimal getShipping() {
        return shipping;
    }

    public void setShipping(BigDecimal shipping) {
        this.shipping = shipping;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
}
