package com.fixhub.user.mapper;

import com.fixhub.common.auth.entity.RegistrationRequest;
import com.fixhub.user.dto.RegistrationRequestDto;
import com.fixhub.user.dto.UserRequestDto;
import com.fixhub.user.dto.UserResponseDto;
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
        dto.setDepartment(user.getDepartment());
        dto.setDesignation(user.getDesignation());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setEmailVerified(true);
        dto.setCreatedAt(user.getCreatedOn());
        dto.setUpdatedAt(user.getUpdatedOn());
        dto.setLastLoginAt(user.getLastLoginAt());
        dto.setHasPassword(user.getPasswordHash() != null);
        return dto;
    }

    public RegistrationRequestDto toRequestDto(RegistrationRequest request) {
        if (request == null) {
            return null;
        }
        RegistrationRequestDto dto = new RegistrationRequestDto();
        dto.setId(request.getId());
        dto.setFullName(request.getFullName());
        dto.setEmail(request.getEmail());
        dto.setEmailVerified(request.isEmailVerified());
        dto.setRequestStatus(request.getRequestStatus());
        dto.setRejectionReason(request.getRejectionReason());
        dto.setCreatedAt(request.getCreatedOn());
        dto.setReviewedOn(request.getReviewedOn());
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
        return user;
    }
}