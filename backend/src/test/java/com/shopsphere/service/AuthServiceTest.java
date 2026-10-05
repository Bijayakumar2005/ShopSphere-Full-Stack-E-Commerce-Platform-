package com.shopsphere.service;

import com.shopsphere.dto.request.LoginRequestDto;
import com.shopsphere.dto.request.RegisterRequestDto;
import com.shopsphere.dto.response.AuthResponseDto;
import com.shopsphere.entity.User;
import com.shopsphere.entity.enums.Role;
import com.shopsphere.exception.BadRequestException;
import com.shopsphere.exception.ResourceNotFoundException;
import com.shopsphere.repository.UserRepository;
import com.shopsphere.security.JwtService;
import com.shopsphere.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setName("John Doe");
        sampleUser.setEmail("john@example.com");
        sampleUser.setPassword("encoded_password");
        sampleUser.setRole(Role.CUSTOMER);
        sampleUser.setActive(true);
    }

    @Test
    @DisplayName("login: Successfully authenticates and returns JWT token with user DTO")
    void login_Success() {
        LoginRequestDto request = new LoginRequestDto("john@example.com", "Secret@123");

        Authentication auth = mock(Authentication.class);
        UserDetails userDetails = mock(UserDetails.class);
        when(auth.getPrincipal()).thenReturn(userDetails);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));
        when(jwtService.generateToken(anyMap(), any(UserDetails.class))).thenReturn("mock-jwt-token");

        AuthResponseDto response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mock-jwt-token");
        assertThat(response.getUser()).isNotNull();
        assertThat(response.getUser().getEmail()).isEqualTo("john@example.com");
        assertThat(response.getUser().getName()).isEqualTo("John Doe");
        assertThat(response.getUser().getRole()).isEqualTo(Role.CUSTOMER);

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userRepository).findByEmail("john@example.com");
    }

    @Test
    @DisplayName("login: Throws BadCredentialsException when credentials are invalid")
    void login_InvalidCredentials_ThrowsException() {
        LoginRequestDto request = new LoginRequestDto("john@example.com", "WrongPassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(BadCredentialsException.class, () -> authService.login(request));

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verifyNoInteractions(jwtService);
    }

    @Test
    @DisplayName("login: Throws BadRequestException when user account is deactivated")
    void login_DeactivatedUser_ThrowsBadRequestException() {
        sampleUser.setActive(false);
        LoginRequestDto request = new LoginRequestDto("john@example.com", "Secret@123");

        Authentication auth = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.login(request));
        assertThat(ex.getMessage()).contains("deactivated");

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verifyNoInteractions(jwtService);
    }

    @Test
    @DisplayName("login: Throws ResourceNotFoundException when user record does not exist after auth")
    void login_UserNotFound_ThrowsException() {
        LoginRequestDto request = new LoginRequestDto("unknown@example.com", "Secret@123");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(mock(Authentication.class));
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("register: Successfully registers user, hashes password, and provisions cart & wishlist")
    void register_Success() {
        RegisterRequestDto request = new RegisterRequestDto(
                "Jane Doe",
                "jane@example.com",
                "Password@123",
                "1234567890"
        );

        when(userRepository.existsByEmail("jane@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("bcrypt_hashed_pwd");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(2L);
            return u;
        });
        when(jwtService.generateToken(anyMap(), any(UserDetails.class))).thenReturn("registered-jwt-token");

        AuthResponseDto response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("registered-jwt-token");
        assertThat(response.getUser().getEmail()).isEqualTo("jane@example.com");
        assertThat(response.getUser().getName()).isEqualTo("Jane Doe");
        assertThat(response.getUser().getRole()).isEqualTo(Role.CUSTOMER);

        verify(userRepository).existsByEmail("jane@example.com");
        verify(passwordEncoder).encode("Password@123");
        verify(userRepository).save(argThat(user ->
                user.getPassword().equals("bcrypt_hashed_pwd") &&
                user.getRole() == Role.CUSTOMER &&
                user.isActive() &&
                user.getCart() != null &&
                user.getWishlist() != null
        ));
    }

    @Test
    @DisplayName("register: Rejects duplicate email with BadRequestException")
    void register_DuplicateEmail_ThrowsBadRequestException() {
        RegisterRequestDto request = new RegisterRequestDto(
                "Existing User",
                "john@example.com",
                "Password@123",
                "1234567890"
        );

        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.register(request));
        assertThat(ex.getMessage()).contains("already exists");

        verify(userRepository).existsByEmail("john@example.com");
        verifyNoMoreInteractions(passwordEncoder);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("register: Normalizes email to trimmed lowercase")
    void register_NormalizesEmail() {
        RegisterRequestDto request = new RegisterRequestDto(
                "Case Sensitive",
                "  USER.Name@Domain.COM  ",
                "Password@123",
                null
        );

        when(userRepository.existsByEmail("user.name@domain.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(3L);
            return u;
        });
        when(jwtService.generateToken(anyMap(), any(UserDetails.class))).thenReturn("token");

        authService.register(request);

        verify(userRepository).existsByEmail("user.name@domain.com");
        verify(userRepository).save(argThat(u -> u.getEmail().equals("user.name@domain.com")));
    }
}
