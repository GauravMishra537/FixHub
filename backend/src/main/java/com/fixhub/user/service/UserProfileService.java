package com.fixhub.user.service;

import com.fixhub.user.dto.UserProfileRequestDto;
import com.fixhub.user.dto.UserProfileResponseDto;

public interface UserProfileService {

    UserProfileResponseDto getProfile(Long userId);

    UserProfileResponseDto updateProfile(Long userId, UserProfileRequestDto request, Long adminId);
}