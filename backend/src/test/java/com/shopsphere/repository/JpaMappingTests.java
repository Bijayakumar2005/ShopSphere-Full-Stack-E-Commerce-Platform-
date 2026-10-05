package com.shopsphere.repository;

import com.shopsphere.entity.*;
import com.shopsphere.entity.enums.OrderStatus;
import com.shopsphere.entity.enums.PaymentStatus;
import com.shopsphere.entity.enums.Role;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class JpaMappingTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Test
    @DisplayName("Verify Category and Product persistence and relationship")
    void testCategoryAndProductPersistence() {
        Category category = new Category("Electronics", "electronics", "⚡", "Electronic gadgets");
        Category savedCat = categoryRepository.save(category);
        assertNotNull(savedCat.getId());

        Product product = new Product(
                "Noise Cancelling Headphones",
                "SoundCraft",
                new BigDecimal("12999.00"),
                15,
                savedCat
        );
        product.setOriginalPrice(new BigDecimal("18999.00"));
        product.setRating(4.5);
        product.setReviewCount(128);

        Product savedProd = productRepository.save(product);
        assertNotNull(savedProd.getId());
        assertEquals("electronics", savedProd.getCategory().getSlug());
    }

    @Test
    @DisplayName("Verify User, Cart, and CartItem cascading and relationships")
    void testUserCartAndItemPersistence() {
        User user = new User("Riya Sharma", "riya@example.com", "encodedPassword123", Role.CUSTOMER);
        User savedUser = userRepository.save(user);

        Category category = categoryRepository.save(new Category("Sports", "sports", "⚽", "Sports gear"));
        Product product = productRepository.save(new Product("Yoga Mat", "FitTech", new BigDecimal("1899.00"), 20, category));

        Cart cart = new Cart(savedUser);
        CartItem cartItem = new CartItem(cart, product, 2);
        cart.addItem(cartItem);

        Cart savedCart = cartRepository.save(cart);
        assertNotNull(savedCart.getId());
        assertEquals(1, savedCart.getItems().size());
        assertEquals(2, savedCart.getItems().get(0).getQuantity());
        assertEquals("Yoga Mat", savedCart.getItems().get(0).getProduct().getName());
    }

    @Test
    @DisplayName("Verify User, Wishlist, and WishlistItem persistence")
    void testUserWishlistPersistence() {
        User user = userRepository.save(new User("Arjun Patel", "arjun@example.com", "pass456", Role.CUSTOMER));
        Category category = categoryRepository.save(new Category("Books", "books", "📚", "Books collection"));
        Product product = productRepository.save(new Product("Clean Code", "TechPro", new BigDecimal("799.00"), 50, category));

        Wishlist wishlist = new Wishlist(user);
        WishlistItem wishlistItem = new WishlistItem(wishlist, product);
        wishlist.addItem(wishlistItem);

        Wishlist savedWishlist = wishlistRepository.save(wishlist);
        assertNotNull(savedWishlist.getId());
        assertEquals(1, savedWishlist.getItems().size());
    }

    @Test
    @DisplayName("Verify User, Order, and OrderItem persistence with OrderStatus and PaymentStatus")
    void testUserOrderPersistence() {
        User user = userRepository.save(new User("Kavya Reddy", "kavya@example.com", "pass789", Role.CUSTOMER));
        Category category = categoryRepository.save(new Category("Home", "home", "🏠", "Home goods"));
        Product product = productRepository.save(new Product("Office Chair", "ErgoDesk", new BigDecimal("18500.00"), 5, category));

        Order order = new Order(
                "ORD-2024-001",
                user,
                new BigDecimal("18500.00"),
                OrderStatus.CONFIRMED,
                PaymentStatus.PAID
        );
        order.setShippingAddress("42 Park Street, Mumbai, Maharashtra 400001");
        order.addItem(new OrderItem(order, product, product.getName(), product.getPrice(), 1));

        Order savedOrder = orderRepository.save(order);
        assertNotNull(savedOrder.getId());
        assertEquals(OrderStatus.CONFIRMED, savedOrder.getOrderStatus());
        assertEquals(PaymentStatus.PAID, savedOrder.getPaymentStatus());

        Optional<Order> fetched = orderRepository.findByOrderNumber("ORD-2024-001");
        assertTrue(fetched.isPresent());
        assertEquals("Kavya Reddy", fetched.get().getUser().getName());
        assertEquals(1, fetched.get().getItems().size());
    }
}
