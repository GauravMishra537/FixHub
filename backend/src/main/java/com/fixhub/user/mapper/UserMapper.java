package com.fixhub.user.mapper;

import com.fixhub.user.dto.UserRequestDto;
import com.fixhub.user.dto.UserResponseDto;
import com.fixhub.user.entity.AccountStatus;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponseDto toDto(User user) {
        if (user == null) {
            return null;
        }

        UserResponseDto dto = new UserResponseDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setRole(user.getRole());
        dto.setStatus(user.getStatus());
        dto.setDepartment(user.getDepartment());
        dto.setDesignation(user.getDesignation());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setEmailVerified(user.isEmailVerified());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }

    public User toEntity(UserRequestDto dto, String passwordHash) {
        if (dto == null) {
            return null;
        }

        User user = new User();
        user.setEmail(dto.getEmail() != null ? dto.getEmail().trim().toLowerCase() : null);
        user.setPasswordHash(passwordHash);
        user.setFullName(dto.getFullName() != null ? dto.getFullName().trim() : null);
        user.setDepartment(dto.getDepartment());
        user.setDesignation(dto.getDesignation());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setRole(Role.USER);
        user.setStatus(AccountStatus.PENDING);
        return user;
    }
}
