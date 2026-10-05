package com.shopsphere.dto.request;

import com.shopsphere.entity.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;

public class OrderStatusUpdateRequestDto {

    @NotNull(message = "Order status is required")
    private OrderStatus status;

    public OrderStatusUpdateRequestDto() {
    }

    public OrderStatusUpdateRequestDto(OrderStatus status) {
        this.status = status;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }
}
