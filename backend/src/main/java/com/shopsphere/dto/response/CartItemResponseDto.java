package com.shopsphere.dto.response;

import com.shopsphere.entity.CartItem;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class CartItemResponseDto {

    private Long id;
    private Long productId;
    private String productName;
    private String productBrand;
    private BigDecimal productPrice;
    private BigDecimal productOriginalPrice;
    private Integer productDiscount;
    private String productImage;
    private String productEmoji;
    private String productAccent;
    private Integer quantity;
    private Integer stockQuantity;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;

    public CartItemResponseDto() {
    }

    public static CartItemResponseDto fromEntity(CartItem item) {
        if (item == null) return null;
        CartItemResponseDto dto = new CartItemResponseDto();
        dto.setId(item.getId());
        dto.setQuantity(item.getQuantity());
        if (item.getProduct() != null) {
            dto.setProductId(item.getProduct().getId());
            dto.setProductName(item.getProduct().getName());
            dto.setProductBrand(item.getProduct().getBrand());
            dto.setProductPrice(item.getProduct().getPrice());
            dto.setProductOriginalPrice(item.getProduct().getOriginalPrice());
            dto.setProductImage(item.getProduct().getImageUrl());
            dto.setProductEmoji(item.getProduct().getEmoji());
            dto.setProductAccent(item.getProduct().getAccent());
            dto.setStockQuantity(item.getProduct().getStockQuantity());

            if (item.getProduct().getOriginalPrice() != null && item.getProduct().getPrice() != null
                    && item.getProduct().getOriginalPrice().compareTo(item.getProduct().getPrice()) > 0) {
                BigDecimal diff = item.getProduct().getOriginalPrice().subtract(item.getProduct().getPrice());
                BigDecimal pct = diff.divide(item.getProduct().getOriginalPrice(), 2, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
                dto.setProductDiscount(pct.intValue());
                dto.setDiscountAmount(diff.multiply(BigDecimal.valueOf(item.getQuantity())));
            } else {
                dto.setProductDiscount(0);
                dto.setDiscountAmount(BigDecimal.ZERO);
            }

            if (item.getProduct().getPrice() != null) {
                dto.setSubtotal(item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            }
        }
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getProductBrand() {
        return productBrand;
    }

    public void setProductBrand(String productBrand) {
        this.productBrand = productBrand;
    }

    public BigDecimal getProductPrice() {
        return productPrice;
    }

    public void setProductPrice(BigDecimal productPrice) {
        this.productPrice = productPrice;
    }

    public BigDecimal getProductOriginalPrice() {
        return productOriginalPrice;
    }

    public void setProductOriginalPrice(BigDecimal productOriginalPrice) {
        this.productOriginalPrice = productOriginalPrice;
    }

    public Integer getProductDiscount() {
        return productDiscount;
    }

    public void setProductDiscount(Integer productDiscount) {
        this.productDiscount = productDiscount;
    }

    public String getProductImage() {
        return productImage;
    }

    public void setProductImage(String productImage) {
        this.productImage = productImage;
    }

    public String getProductEmoji() {
        return productEmoji;
    }

    public void setProductEmoji(String productEmoji) {
        this.productEmoji = productEmoji;
    }

    public String getProductAccent() {
        return productAccent;
    }

    public void setProductAccent(String productAccent) {
        this.productAccent = productAccent;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }
}
