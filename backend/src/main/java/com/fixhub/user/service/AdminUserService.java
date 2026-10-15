package com.fixhub.user.service;

import com.fixhub.common.auth.entity.RequestStatus;
import com.fixhub.user.dto.RegistrationRequestDto;
import com.fixhub.user.dto.UserResponseDto;

import java.util.List;

public interface AdminUserService {

    List<RegistrationRequestDto> listRequests(RequestStatus status);

    List<UserResponseDto> listUsers();

    UserResponseDto approve(Long requestId, Long actorId);

    RegistrationRequestDto reject(Long requestId, String reason, Long actorId);

    void deleteUser(Long userId, Long actorId);
}