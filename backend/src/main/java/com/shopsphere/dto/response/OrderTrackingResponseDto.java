package com.shopsphere.dto.response;

import com.shopsphere.entity.Order;
import com.shopsphere.entity.enums.OrderStatus;
import com.shopsphere.entity.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class OrderTrackingResponseDto {

    private Long orderId;
    private String orderNumber;
    private Long userId;
    private String customerName;
    private LocalDateTime orderDate;
    private LocalDateTime lastUpdated;
    private OrderStatus currentStatus;
    private PaymentStatus paymentStatus;
    private String paymentMethod;
    private String shippingAddress;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;
    private Integer totalItems = 0;
    private Integer currentStepIndex = 0;

    @com.fasterxml.jackson.annotation.JsonProperty("isDelivered")
    private boolean isDelivered = false;

    @com.fasterxml.jackson.annotation.JsonProperty("isCancelled")
    private boolean isCancelled = false;
    private List<OrderItemResponseDto> items = new ArrayList<>();
    private List<TrackingStepDto> timeline = new ArrayList<>();

    public OrderTrackingResponseDto() {
    }

    public static OrderTrackingResponseDto fromEntity(Order order, List<TrackingStepDto> timeline, int currentStepIndex) {
        if (order == null) return null;
        OrderTrackingResponseDto dto = new OrderTrackingResponseDto();
        dto.setOrderId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        if (order.getUser() != null) {
            dto.setUserId(order.getUser().getId());
            dto.setCustomerName(order.getUser().getName());
        }
        dto.setOrderDate(order.getCreatedAt());
        dto.setLastUpdated(order.getUpdatedAt() != null ? order.getUpdatedAt() : order.getCreatedAt());
        dto.setCurrentStatus(order.getOrderStatus());
        dto.setPaymentStatus(order.getPaymentStatus());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setShippingAddress(order.getShippingAddress());
        dto.setSubtotal(order.getSubtotal());
        dto.setDiscountAmount(order.getDiscountAmount());
        dto.setShippingFee(order.getShippingFee());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setTimeline(timeline != null ? timeline : new ArrayList<>());
        dto.setCurrentStepIndex(currentStepIndex);
        dto.setDelivered(order.getOrderStatus() == OrderStatus.DELIVERED);
        dto.setCancelled(order.getOrderStatus() == OrderStatus.CANCELLED);

        int count = 0;
        BigDecimal calculatedSubtotal = BigDecimal.ZERO;
        if (order.getItems() != null) {
            for (var item : order.getItems()) {
                OrderItemResponseDto itemDto = OrderItemResponseDto.fromEntity(item);
                dto.getItems().add(itemDto);
                count += item.getQuantity();
                if (itemDto.getSubtotal() != null) {
                    calculatedSubtotal = calculatedSubtotal.add(itemDto.getSubtotal());
                }
            }
        }
        dto.setTotalItems(count);
        if (dto.getSubtotal() == null) {
            dto.setSubtotal(calculatedSubtotal);
        }
        if (dto.getShippingFee() == null && dto.getTotalAmount() != null && dto.getSubtotal() != null) {
            BigDecimal fee = dto.getTotalAmount().subtract(dto.getSubtotal());
            dto.setShippingFee(fee.compareTo(BigDecimal.ZERO) >= 0 ? fee : BigDecimal.ZERO);
        }

        return dto;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public LocalDateTime getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDateTime orderDate) {
        this.orderDate = orderDate;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public OrderStatus getCurrentStatus() {
        return currentStatus;
    }

    public void setCurrentStatus(OrderStatus currentStatus) {
        this.currentStatus = currentStatus;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
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

    public BigDecimal getShippingFee() {
        return shippingFee;
    }

    public void setShippingFee(BigDecimal shippingFee) {
        this.shippingFee = shippingFee;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public Integer getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(Integer totalItems) {
        this.totalItems = totalItems;
    }

    public Integer getCurrentStepIndex() {
        return currentStepIndex;
    }

    public void setCurrentStepIndex(Integer currentStepIndex) {
        this.currentStepIndex = currentStepIndex;
    }

    public boolean isDelivered() {
        return isDelivered;
    }

    public void setDelivered(boolean delivered) {
        isDelivered = delivered;
    }

    public boolean isCancelled() {
        return isCancelled;
    }

    public void setCancelled(boolean cancelled) {
        isCancelled = cancelled;
    }

    public List<OrderItemResponseDto> getItems() {
        return items;
    }

    public void setItems(List<OrderItemResponseDto> items) {
        this.items = items;
    }

    public List<TrackingStepDto> getTimeline() {
        return timeline;
    }

    public void setTimeline(List<TrackingStepDto> timeline) {
        this.timeline = timeline;
    }
}
