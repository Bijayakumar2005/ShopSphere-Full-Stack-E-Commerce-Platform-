package com.shopsphere.controller;

import com.shopsphere.entity.Category;
import com.shopsphere.entity.Product;
import com.shopsphere.repository.CategoryRepository;
import com.shopsphere.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class ProductFilterIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private Category audioCat;
    private Category gamingCat;

    @BeforeEach
    void setUp() {
        productRepository.deleteAll();
        categoryRepository.deleteAll();

        audioCat = categoryRepository.save(new Category(
                "Audio", "audio", "🎧", "Headphones and Speakers"
        ));
        gamingCat = categoryRepository.save(new Category(
                "Gaming", "gaming", "🎮", "Keyboards and Consoles"
        ));

        // P1: Audio, Sony, $100, rating 4.5
        Product p1 = new Product("Sony WH-1000XM4 Noise Cancelling", "Sony", new BigDecimal("100.00"), 10, audioCat);
        p1.setDescription("Premium active noise cancellation headphones");
        p1.setRating(4.5);
        p1.setActive(true);
        productRepository.save(p1);

        // P2: Audio, Bose, $300, rating 4.9
        Product p2 = new Product("Bose QuietComfort Earbuds", "Bose", new BigDecimal("300.00"), 5, audioCat);
        p2.setDescription("True wireless noise cancelling earbuds");
        p2.setRating(4.9);
        p2.setActive(true);
        productRepository.save(p2);

        // P3: Gaming, Razer, $150, rating 4.2
        Product p3 = new Product("Razer BlackWidow Mechanical Keyboard", "Razer", new BigDecimal("150.00"), 20, gamingCat);
        p3.setDescription("RGB backlit mechanical gaming keyboard");
        p3.setRating(4.2);
        p3.setActive(true);
        productRepository.save(p3);

        // P4: Gaming, Logitech, $50, rating 3.8
        Product p4 = new Product("Logitech G203 Gaming Mouse", "Logitech", new BigDecimal("50.00"), 30, gamingCat);
        p4.setDescription("Wired optical gaming mouse with Lightsync RGB");
        p4.setRating(3.8);
        p4.setActive(true);
        productRepository.save(p4);
    }

    @Test
    @DisplayName("Filter by keyword matching name and description")
    void testKeywordSearch() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("keyword", "earbuds")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(1)))
                .andExpect(jsonPath("$.data.content[0].name", containsString("QuietComfort Earbuds")));

        mockMvc.perform(get("/api/products")
                        .param("keyword", "gaming")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(2)));
    }

    @Test
    @DisplayName("Filter by category slug")
    void testCategoryFilter() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("category", "audio")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(2)))
                .andExpect(jsonPath("$.data.content[*].category.slug", everyItem(is("audio"))));
    }

    @Test
    @DisplayName("Filter by single and multiple brands")
    void testBrandFilter() throws Exception {
        // Single brand
        mockMvc.perform(get("/api/products")
                        .param("brand", "Sony")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(1)))
                .andExpect(jsonPath("$.data.content[0].brand", is("Sony")));

        // Multi-brand comma separated
        mockMvc.perform(get("/api/products")
                        .param("brand", "Sony,Razer")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(2)))
                .andExpect(jsonPath("$.data.content[*].brand", containsInAnyOrder("Sony", "Razer")));
    }

    @Test
    @DisplayName("Filter by price range min and max")
    void testPriceRangeFilter() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("minPrice", "100.00")
                        .param("maxPrice", "200.00")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(2)))
                .andExpect(jsonPath("$.data.content[*].price", containsInAnyOrder(100.00, 150.00)));
    }

    @Test
    @DisplayName("Filter by minimum customer rating")
    void testRatingFilter() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("rating", "4.5")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(2)))
                .andExpect(jsonPath("$.data.content[*].rating", everyItem(greaterThanOrEqualTo(4.5))));
    }

    @Test
    @DisplayName("Sorting by price ascending and descending")
    void testPriceSorting() throws Exception {
        // Price ASC
        mockMvc.perform(get("/api/products")
                        .param("sort", "priceAsc")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].price", is(50.00)))
                .andExpect(jsonPath("$.data.content[1].price", is(100.00)))
                .andExpect(jsonPath("$.data.content[2].price", is(150.00)))
                .andExpect(jsonPath("$.data.content[3].price", is(300.00)));

        // Price DESC
        mockMvc.perform(get("/api/products")
                        .param("sort", "priceDesc")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].price", is(300.00)))
                .andExpect(jsonPath("$.data.content[3].price", is(50.00)));
    }

    @Test
    @DisplayName("Pagination test: page navigation and size limit")
    void testPagination() throws Exception {
        // Page 0, Size 2
        mockMvc.perform(get("/api/products")
                        .param("sort", "priceAsc")
                        .param("page", "0")
                        .param("size", "2")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.pageNumber", is(0)))
                .andExpect(jsonPath("$.data.pageSize", is(2)))
                .andExpect(jsonPath("$.data.totalElements", is(4)))
                .andExpect(jsonPath("$.data.totalPages", is(2)))
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.content[0].price", is(50.00)))
                .andExpect(jsonPath("$.data.content[1].price", is(100.00)));

        // Page 1, Size 2
        mockMvc.perform(get("/api/products")
                        .param("sort", "priceAsc")
                        .param("page", "1")
                        .param("size", "2")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.pageNumber", is(1)))
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.content[0].price", is(150.00)))
                .andExpect(jsonPath("$.data.content[1].price", is(300.00)));
    }

    @Test
    @DisplayName("Combined search, filtering, sorting, and pagination")
    void testCombinedFilters() throws Exception {
        // Example concept: GET /api/products?keyword=noise&category=audio&minPrice=50&maxPrice=500&sort=priceAsc&page=0&size=12
        mockMvc.perform(get("/api/products")
                        .param("keyword", "noise")
                        .param("category", "audio")
                        .param("minPrice", "50")
                        .param("maxPrice", "500")
                        .param("sort", "priceAsc")
                        .param("page", "0")
                        .param("size", "12")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(2)))
                .andExpect(jsonPath("$.data.content[0].price", is(100.00)))
                .andExpect(jsonPath("$.data.content[1].price", is(300.00)));
    }

    @Test
    @DisplayName("Empty results when criteria matches no products")
    void testNoResults() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("keyword", "nonexistentproductxyz")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(0)))
                .andExpect(jsonPath("$.data.content", hasSize(0)))
                .andExpect(jsonPath("$.data.totalPages", is(0)));
    }
}
