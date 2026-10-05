package com.shopsphere.service;

import com.shopsphere.dto.request.LoginRequestDto;
import com.shopsphere.dto.request.RegisterRequestDto;
import com.shopsphere.dto.response.AuthResponseDto;

public interface AuthService {

    AuthResponseDto register(RegisterRequestDto request);

    AuthResponseDto login(LoginRequestDto request);
}
