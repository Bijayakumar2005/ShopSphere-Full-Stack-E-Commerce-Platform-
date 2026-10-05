package com.shopsphere.service.impl;

import com.shopsphere.dto.request.CategoryRequestDto;
import com.shopsphere.dto.response.CategoryDto;
import com.shopsphere.entity.Category;
import com.shopsphere.exception.BadRequestException;
import com.shopsphere.exception.ResourceNotFoundException;
import com.shopsphere.repository.CategoryRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.service.CategoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();

        Map<Long, Integer> productCountMap = new HashMap<>();
        List<Object[]> counts = productRepository.countProductsGroupedByCategory();
        for (Object[] row : counts) {
            if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                Long catId = ((Number) row[0]).longValue();
                int count = ((Number) row[1]).intValue();
                productCountMap.put(catId, count);
            }
        }

        return categories.stream().map(c -> {
            CategoryDto dto = CategoryDto.fromEntity(c);
            dto.setProductCount(productCountMap.getOrDefault(c.getId(), 0));
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        CategoryDto dto = CategoryDto.fromEntity(category);
        long count = productRepository.countByCategoryId(id);
        dto.setProductCount((int) count);
        return dto;
    }

    @Override
    @Transactional
    public CategoryDto createCategory(CategoryRequestDto request) {
        String trimmedName = request.getName().trim();

        if (categoryRepository.existsByName(trimmedName)) {
            throw new BadRequestException("Category with name '" + trimmedName + "' already exists");
        }

        String slug = (request.getSlug() != null && !request.getSlug().trim().isEmpty())
                ? toSlug(request.getSlug())
                : toSlug(trimmedName);

        if (categoryRepository.existsBySlug(slug)) {
            throw new BadRequestException("Category with slug '" + slug + "' already exists");
        }

        Category category = new Category();
        category.setName(trimmedName);
        category.setSlug(slug);
        category.setIcon(request.getIcon() != null && !request.getIcon().trim().isEmpty() ? request.getIcon().trim() : "📁");
        category.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);

        Category saved = categoryRepository.save(category);
        CategoryDto dto = CategoryDto.fromEntity(saved);
        dto.setProductCount(0);
        return dto;
    }

    @Override
    @Transactional
    public CategoryDto updateCategory(Long id, CategoryRequestDto request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        String trimmedName = request.getName().trim();

        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(trimmedName, id)) {
            throw new BadRequestException("Category with name '" + trimmedName + "' already exists");
        }

        String slug = (request.getSlug() != null && !request.getSlug().trim().isEmpty())
                ? toSlug(request.getSlug())
                : toSlug(trimmedName);

        if (categoryRepository.existsBySlugAndIdNot(slug, id)) {
            throw new BadRequestException("Category with slug '" + slug + "' already exists");
        }

        category.setName(trimmedName);
        category.setSlug(slug);
        if (request.getIcon() != null) {
            category.setIcon(request.getIcon().trim());
        }
        if (request.getDescription() != null) {
            category.setDescription(request.getDescription().trim());
        }

        Category updated = categoryRepository.save(category);
        CategoryDto dto = CategoryDto.fromEntity(updated);
        long count = productRepository.countByCategoryId(id);
        dto.setProductCount((int) count);
        return dto;
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        long productCount = productRepository.countByCategoryId(id);
        if (productCount > 0) {
            throw new BadRequestException("Cannot delete category '" + category.getName() + "' because it contains " + productCount + " product(s). Please reassign or delete these products first.");
        }

        categoryRepository.delete(category);
    }

    private String toSlug(String input) {
        if (input == null) return "";
        return input.toLowerCase(Locale.ROOT)
                .trim()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
    }
}
