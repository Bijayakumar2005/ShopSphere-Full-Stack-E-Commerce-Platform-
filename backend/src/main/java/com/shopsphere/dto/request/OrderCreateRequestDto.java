package com.shopsphere.dto.request;

import jakarta.validation.constraints.NotBlank;

public class OrderCreateRequestDto {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Phone number is required")
    private String phone;

    @NotBlank(message = "Street address is required")
    private String address;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    @NotBlank(message = "Postal code is required")
    private String postalCode;

    private String paymentMethod = "CASH_ON_DELIVERY";

    private String shippingAddress;

    public OrderCreateRequestDto() {
    }

    public OrderCreateRequestDto(String fullName, String phone, String address, String city, String state, String postalCode) {
        this.fullName = fullName;
        this.phone = phone;
        this.address = address;
        this.city = city;
        this.state = state;
        this.postalCode = postalCode;
        this.paymentMethod = "CASH_ON_DELIVERY";
    }

    public OrderCreateRequestDto(String fullName, String phone, String address, String city, String state, String postalCode, String paymentMethod) {
        this(fullName, phone, address, city, state, postalCode);
        if (paymentMethod != null && !paymentMethod.trim().isEmpty()) {
            this.paymentMethod = paymentMethod;
        }
    }

    public String getFormattedShippingAddress() {
        if (shippingAddress != null && !shippingAddress.trim().isEmpty() && (fullName == null || fullName.trim().isEmpty())) {
            return shippingAddress;
        }
        StringBuilder sb = new StringBuilder();
        if (fullName != null && !fullName.trim().isEmpty()) {
            sb.append(fullName.trim());
        }
        if (phone != null && !phone.trim().isEmpty()) {
            sb.append(" | Phone: ").append(phone.trim());
        }
        if ((address != null && !address.trim().isEmpty()) || (city != null && !city.trim().isEmpty()) ||
                (state != null && !state.trim().isEmpty()) || (postalCode != null && !postalCode.trim().isEmpty())) {
            sb.append("\n");
            if (address != null && !address.trim().isEmpty()) sb.append(address.trim());
            if (city != null && !city.trim().isEmpty()) sb.append(", ").append(city.trim());
            if (state != null && !state.trim().isEmpty()) sb.append(", ").append(state.trim());
            if (postalCode != null && !postalCode.trim().isEmpty()) sb.append(" - ").append(postalCode.trim());
        }
        return sb.toString().trim();
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
