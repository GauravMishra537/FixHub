package com.fixhub.user.service;

import com.fixhub.user.dto.AccountProfileRequestDto;
import com.fixhub.user.dto.UserResponseDto;

public interface AccountProfileService {

    UserResponseDto updateMyProfile(Long userId, AccountProfileRequestDto request);
}