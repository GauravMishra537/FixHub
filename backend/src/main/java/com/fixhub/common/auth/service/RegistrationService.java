package com.fixhub.common.auth.service;

import com.fixhub.common.auth.dto.RegisterRequestDto;
import com.fixhub.user.dto.UserResponseDto;

public interface RegistrationService {

    UserResponseDto register(RegisterRequestDto requestDto);

    void verifyEmail(String token);

    void resendVerification(String email);
}
