package com.fixhub.user.service;

import com.fixhub.user.dto.UserRequestDto;
import com.fixhub.user.dto.UserResponseDto;

import java.util.List;

public interface UserService {

    UserResponseDto createUser(UserRequestDto requestDto);

    UserResponseDto getUserById(Long id);

    UserResponseDto getUserByEmail(String email);

    List<UserResponseDto> getAllUsers();
}
