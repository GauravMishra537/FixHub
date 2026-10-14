package com.fixhub.common.auth.service.impl;

import com.fixhub.common.audit.service.AuditService;
import com.fixhub.common.auth.dto.LoginRequestDto;
import com.fixhub.common.auth.dto.LoginResponseDto;
import com.fixhub.common.auth.security.JwtService;
import com.fixhub.common.auth.service.AuthenticationService;
import com.fixhub.common.exception.BadRequestException;
import com.fixhub.common.exception.ResourceNotFoundException;
import com.fixhub.common.exception.UnauthorizedException;
import com.fixhub.user.dto.UserResponseDto;
import com.fixhub.user.entity.AccountStatus;
import com.fixhub.user.entity.User;
import com.fixhub.user.mapper.UserMapper;
import com.fixhub.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;

    public AuthenticationServiceImpl(
            UserRepository userRepository,
            UserMapper userMapper,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuditService auditService
    ) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public LoginResponseDto login(LoginRequestDto requestDto) {
        String normalizedEmail = requestDto.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> {
                    auditService.logEvent("LOGIN_FAILED", null, normalizedEmail, "Failed login attempt (email not found)");
                    return new UnauthorizedException("Invalid email or password");
                });

        if (user.getPasswordHash() == null
            || !passwordEncoder.matches(requestDto.getPassword(), user.getPasswordHash())) {
            auditService.logEvent("LOGIN_FAILED", user.getId(), user.getEmail(), "Failed login attempt (incorrect password)");
            throw new UnauthorizedException("Invalid email or password");
        }

        if (!user.isEmailVerified()) {
            throw new BadRequestException("Please verify your email address before logging in.");
        }

        if (user.getStatus() == AccountStatus.PENDING) {
            throw new BadRequestException("Your account is pending administrator approval.");
        }

        if (user.getStatus() == AccountStatus.SUSPENDED) {
            throw new BadRequestException("Your account has been suspended. Please contact your system administrator.");
        }

        if (user.getStatus() == AccountStatus.REJECTED) {
            String reason = user.getRejectionReason();
            throw new BadRequestException("Your registration was rejected."
            + (reason != null && !reason.isBlank() ? " Reason: " + reason : ""));
        }

        user.setLastLoginAt(java.time.Instant.now());
        String token = jwtService.generateToken(user);
        UserResponseDto userDto = userMapper.toDto(user);

        auditService.logEvent("LOGIN_SUCCESS", user.getId(), user.getEmail(), "User logged in successfully");

        return new LoginResponseDto(token, userDto);
    }

    @Override
    public UserResponseDto getCurrentUser(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalizedEmail));
        return userMapper.toDto(user);
    }
}
