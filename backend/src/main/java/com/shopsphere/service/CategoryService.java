package com.shopsphere.service;

import com.shopsphere.dto.request.CategoryRequestDto;
import com.shopsphere.dto.response.CategoryDto;

import java.util.List;

public interface CategoryService {

    List<CategoryDto> getAllCategories();

    CategoryDto getCategoryById(Long id);

    CategoryDto createCategory(CategoryRequestDto request);

    CategoryDto updateCategory(Long id, CategoryRequestDto request);

    void deleteCategory(Long id);
}
