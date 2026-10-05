package com.shopsphere.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class StockUpdateRequestDto {

    @NotNull(message = "Stock quantity is required")
    @Min(value = 0, message = "Stock quantity cannot be negative")
    private Integer stockQuantity;

    public StockUpdateRequestDto() {
    }

    public StockUpdateRequestDto(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public Integer getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    // Alias for flexibility
    public Integer getStock() {
        return stockQuantity;
    }

    public void setStock(Integer stock) {
        if (stock != null) {
            this.stockQuantity = stock;
        }
    }
}
