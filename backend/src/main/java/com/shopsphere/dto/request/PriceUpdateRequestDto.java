package com.shopsphere.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class PriceUpdateRequestDto {

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;

    private BigDecimal originalPrice;

    private Integer discount;

    public PriceUpdateRequestDto() {
    }

    public PriceUpdateRequestDto(BigDecimal price, BigDecimal originalPrice) {
        this.price = price;
        this.originalPrice = originalPrice;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getOriginalPrice() {
        if (originalPrice != null) {
            return originalPrice;
        }
        if (discount != null && discount > 0 && price != null && discount < 100) {
            BigDecimal factor = BigDecimal.ONE.subtract(BigDecimal.valueOf(discount).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            return price.divide(factor, 2, RoundingMode.HALF_UP);
        }
        return price;
    }

    public void setOriginalPrice(BigDecimal originalPrice) {
        this.originalPrice = originalPrice;
    }

    public Integer getDiscount() {
        return discount;
    }

    public void setDiscount(Integer discount) {
        this.discount = discount;
    }
}
