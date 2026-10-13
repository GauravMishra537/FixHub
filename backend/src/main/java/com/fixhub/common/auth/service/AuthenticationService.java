package com.fixhub.common.auth.service;

import com.fixhub.common.auth.dto.LoginRequestDto;
import com.fixhub.common.auth.dto.LoginResponseDto;
import com.fixhub.user.dto.UserResponseDto;

public interface AuthenticationService {

    LoginResponseDto login(LoginRequestDto requestDto);

    UserResponseDto getCurrentUser(String email);
}
