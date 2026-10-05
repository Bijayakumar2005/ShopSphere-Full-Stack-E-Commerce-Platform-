package com.shopsphere.service;

import com.shopsphere.dto.response.AdminDashboardResponseDto;
import com.shopsphere.dto.response.PagedResponse;
import com.shopsphere.dto.response.ProductResponseDto;

import java.util.Map;

public interface AdminService {

    AdminDashboardResponseDto getDashboardOverview();

    PagedResponse<ProductResponseDto> getInventory(
            String keyword,
            String stockStatus,
            int page,
            int size,
            String sortBy,
            String sortDir
    );

    Map<String, Object> getInventoryStats();
}
