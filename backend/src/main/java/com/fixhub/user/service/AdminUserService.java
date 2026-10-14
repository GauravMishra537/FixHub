package com.fixhub.user.service;

import com.fixhub.user.dto.UserResponseDto;
import com.fixhub.user.entity.AccountStatus;

import java.util.List;

public interface AdminUserService {

    List<UserResponseDto> listUsers(AccountStatus status);

    UserResponseDto getUser(Long id);

    UserResponseDto approve(Long id, String actorEmail);

    UserResponseDto reject(Long id, String reason, String actorEmail);

    UserResponseDto suspend(Long id, String actorEmail);

    UserResponseDto restore(Long id, String actorEmail);
}