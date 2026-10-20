package com.fixhub.user.service.impl;

import com.fixhub.common.audit.service.AuditRecorder;
import com.fixhub.user.dto.AccountProfileRequestDto;
import com.fixhub.user.dto.UserResponseDto;
import com.fixhub.user.entity.User;
import com.fixhub.user.mapper.UserMapper;
import com.fixhub.user.repository.UserRepository;
import com.fixhub.user.service.AccountProfileService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccountProfileServiceImpl implements AccountProfileService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final AuditRecorder auditRecorder;

    public AccountProfileServiceImpl(UserRepository userRepository,
                                     UserMapper userMapper,
                                     AuditRecorder auditRecorder) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.auditRecorder = auditRecorder;
    }

    @Override
    @Transactional
    public UserResponseDto updateMyProfile(Long userId, AccountProfileRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (request.getPhoneNumber() != null) {
            String phone = request.getPhoneNumber().trim();
            user.setPhoneNumber(phone.isEmpty() ? null : phone);
        }
        if (request.getWorkLocation() != null) {
            String location = request.getWorkLocation().trim();
            user.setWorkLocation(location.isEmpty() ? null : location);
        }
        userRepository.save(user);

        auditRecorder.record("ACCOUNT_UPDATED", "Contact details updated by " + user.getEmail());
        return userMapper.toDto(user);
    }
}