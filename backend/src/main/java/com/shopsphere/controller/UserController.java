package com.shopsphere.controller;

import com.shopsphere.dto.request.ChangePasswordRequestDto;
import com.shopsphere.dto.request.UpdateProfileRequestDto;
import com.shopsphere.dto.response.ApiResponse;
import com.shopsphere.dto.response.UserResponseDto;
import com.shopsphere.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponseDto>> getProfile(Authentication authentication) {
        String email = authentication.getName();
        UserResponseDto profile = userService.getProfile(email);
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", profile));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponseDto>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequestDto request
    ) {
        String email = authentication.getName();
        UserResponseDto updated = userService.updateProfile(email, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updated));
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequestDto request
    ) {
        String email = authentication.getName();
        userService.changePassword(email, request);
        return ResponseEntity.ok(ApiResponse.message("Password changed successfully"));
    }
}
