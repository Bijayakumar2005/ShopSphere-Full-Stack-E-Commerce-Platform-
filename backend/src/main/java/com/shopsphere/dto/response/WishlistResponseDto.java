package com.shopsphere.dto.response;

import com.shopsphere.entity.Wishlist;

import java.util.ArrayList;
import java.util.List;

public class WishlistResponseDto {

    private Long id;
    private Long userId;
    private List<WishlistItemResponseDto> items = new ArrayList<>();
    private Integer totalItems = 0;

    public WishlistResponseDto() {
    }

    public static WishlistResponseDto fromEntity(Wishlist wishlist) {
        if (wishlist == null) return null;
        WishlistResponseDto dto = new WishlistResponseDto();
        dto.setId(wishlist.getId());
        if (wishlist.getUser() != null) {
            dto.setUserId(wishlist.getUser().getId());
        }
        if (wishlist.getItems() != null) {
            for (var item : wishlist.getItems()) {
                dto.getItems().add(WishlistItemResponseDto.fromEntity(item));
            }
            dto.setTotalItems(wishlist.getItems().size());
        }
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

    public List<WishlistItemResponseDto> getItems() {
        return items;
    }

    public void setItems(List<WishlistItemResponseDto> items) {
        this.items = items;
    }

    public Integer getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(Integer totalItems) {
        this.totalItems = totalItems;
    }
}
