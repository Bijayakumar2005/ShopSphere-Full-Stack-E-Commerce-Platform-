package com.shopsphere.service;

import com.shopsphere.dto.request.ChangePasswordRequestDto;
import com.shopsphere.dto.request.UpdateProfileRequestDto;
import com.shopsphere.dto.response.UserResponseDto;

public interface UserService {

    UserResponseDto getProfile(String email);

    UserResponseDto updateProfile(String email, UpdateProfileRequestDto request);

    void changePassword(String email, ChangePasswordRequestDto request);
}
