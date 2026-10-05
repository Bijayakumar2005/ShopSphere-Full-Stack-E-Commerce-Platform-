package com.shopsphere.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class ProductUpdateRequestDto {

    @Size(min = 2, max = 200, message = "Product name must be between 2 and 200 characters")
    private String name;

    @Size(min = 1, max = 100, message = "Brand must be between 1 and 100 characters")
    private String brand;

    private String description;

    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal price;

    private BigDecimal originalPrice;

    @Min(value = 0, message = "Stock quantity cannot be negative")
    private Integer stockQuantity;

    private Long categoryId;

    private String imageUrl;
    private String emoji;
    private String accent;
    private Boolean active;

    public ProductUpdateRequestDto() {
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    private Integer discount;

    public Integer getDiscount() { return discount; }
    public void setDiscount(Integer discount) { this.discount = discount; }

    public BigDecimal getOriginalPrice() {
        if (originalPrice != null) {
            return originalPrice;
        }
        if (discount != null && discount > 0 && discount < 100 && price != null) {
            java.math.BigDecimal factor = java.math.BigDecimal.ONE.subtract(java.math.BigDecimal.valueOf(discount).divide(java.math.BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP));
            return price.divide(factor, 2, java.math.RoundingMode.HALF_UP);
        }
        return originalPrice;
    }
    public void setOriginalPrice(BigDecimal originalPrice) { this.originalPrice = originalPrice; }

    public Integer getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }

    public Integer getStock() { return stockQuantity; }
    public void setStock(Integer stock) {
        if (this.stockQuantity == null) {
            this.stockQuantity = stock;
        }
    }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getImage() { return imageUrl; }
    public void setImage(String image) {
        if (this.imageUrl == null) {
            this.imageUrl = image;
        }
    }

    public String getEmoji() { return emoji; }
    public void setEmoji(String emoji) { this.emoji = emoji; }

    public String getAccent() { return accent; }
    public void setAccent(String accent) { this.accent = accent; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
