package com.shopsphere.dto.response;

import com.shopsphere.entity.WishlistItem;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class WishlistItemResponseDto {

    private Long id;
    private Long productId;
    private String productName;
    private String productBrand;
    private String productCategory;
    private BigDecimal productPrice;
    private BigDecimal productOriginalPrice;
    private Integer productDiscount;
    private Double productRating;
    private String productImage;
    private String productEmoji;
    private String productAccent;
    private Integer stockQuantity;

    public WishlistItemResponseDto() {
    }

    public static WishlistItemResponseDto fromEntity(WishlistItem item) {
        if (item == null) return null;
        WishlistItemResponseDto dto = new WishlistItemResponseDto();
        dto.setId(item.getId());
        if (item.getProduct() != null) {
            var product = item.getProduct();
            dto.setProductId(product.getId());
            dto.setProductName(product.getName());
            dto.setProductBrand(product.getBrand());
            if (product.getCategory() != null) {
                dto.setProductCategory(product.getCategory().getName());
            }
            dto.setProductPrice(product.getPrice());
            dto.setProductOriginalPrice(product.getOriginalPrice());
            dto.setProductRating(product.getRating());
            dto.setProductImage(product.getImageUrl());
            dto.setProductEmoji(product.getEmoji());
            dto.setProductAccent(product.getAccent());
            dto.setStockQuantity(product.getStockQuantity());

            if (product.getOriginalPrice() != null && product.getPrice() != null
                    && product.getOriginalPrice().compareTo(product.getPrice()) > 0) {
                BigDecimal diff = product.getOriginalPrice().subtract(product.getPrice());
                int discount = diff.multiply(BigDecimal.valueOf(100))
                        .divide(product.getOriginalPrice(), 0, RoundingMode.HALF_UP)
                        .intValue();
                dto.setProductDiscount(discount);
            } else {
                dto.setProductDiscount(0);
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

    public String getProductCategory() {
        return productCategory;
    }

    public void setProductCategory(String productCategory) {
        this.productCategory = productCategory;
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

    public Double getProductRating() {
        return productRating;
    }

    public void setProductRating(Double productRating) {
        this.productRating = productRating;
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

    public Integer getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }
}
