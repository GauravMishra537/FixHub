package com.fixhub.common.auth.service.impl;

import com.fixhub.common.audit.service.AuditService;
import com.fixhub.common.auth.dto.LoginRequestDto;
import com.fixhub.common.auth.dto.LoginResponseDto;
import com.fixhub.common.auth.entity.RegistrationRequest;
import com.fixhub.common.auth.entity.RequestStatus;
import com.fixhub.common.auth.repository.RegistrationRequestRepository;
import com.fixhub.common.auth.security.JwtService;
import com.fixhub.common.auth.service.AuthenticationService;
import com.fixhub.common.exception.BadRequestException;
import com.fixhub.common.exception.ResourceNotFoundException;
import com.fixhub.common.exception.UnauthorizedException;
import com.fixhub.user.dto.UserResponseDto;
import com.fixhub.user.entity.User;
import com.fixhub.user.mapper.UserMapper;
import com.fixhub.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserRepository userRepository;
    private final RegistrationRequestRepository requestRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;

    public AuthenticationServiceImpl(UserRepository userRepository,
                                     RegistrationRequestRepository requestRepository,
                                     UserMapper userMapper,
                                     PasswordEncoder passwordEncoder,
                                     JwtService jwtService,
                                     AuditService auditService) {
        this.userRepository = userRepository;
        this.requestRepository = requestRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public LoginResponseDto login(LoginRequestDto requestDto) {
        String email = requestDto.getEmail().trim().toLowerCase();
        String password = requestDto.getPassword();

        Optional<User> found = userRepository.findByEmail(email);
        if (found.isPresent()) {
            User user = found.get();
            if (!passwordMatches(password, user.getPasswordHash())) {
                failed(user.getId(), email, "incorrect password");
            }
            user.setLastLoginAt(Instant.now());
            String token = jwtService.generateToken(user);
            auditService.logEvent("LOGIN_SUCCESS", user.getId(), user.getEmail(), "User logged in successfully");
            return new LoginResponseDto(token, userMapper.toDto(user));
        }

        // Not an approved user: the registration request decides the message,
        // but only after the password matches.
        Optional<RegistrationRequest> latest = requestRepository.findFirstByEmailOrderByCreatedOnDesc(email);
        if (latest.isPresent() && passwordMatches(password, latest.get().getPasswordHash())) {
            RegistrationRequest request = latest.get();
            if (request.getRequestStatus() == RequestStatus.PENDING) {
                if (!request.isEmailVerified()) {
                    throw new BadRequestException("Please verify your email address before logging in.");
                }
                throw new BadRequestException("Your account is pending administrator approval.");
            }
            if (request.getRequestStatus() == RequestStatus.REJECTED) {
                String reason = request.getRejectionReason();
                throw new BadRequestException("Your registration was rejected."
                        + (reason != null && !reason.isBlank() ? " Reason: " + reason : ""));
            }
        }

        Optional<String> deletedHash = userRepository.findDeletedPasswordHash(email);
        if (deletedHash.isPresent() && passwordMatches(password, deletedHash.get())) {
            throw new BadRequestException("Your account has been removed. Please register again.");
        }

        failed(null, email, "unknown account or incorrect password");
        return null; // unreachable, failed() always throws
    }

    @Override
    public UserResponseDto getCurrentUser(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalizedEmail));
        return userMapper.toDto(user);
    }

    private boolean passwordMatches(String raw, String hash) {
        return hash != null && passwordEncoder.matches(raw, hash);
    }

    private void failed(Long userId, String email, String reason) {
        auditService.logEvent("LOGIN_FAILED", userId, email, "Failed login attempt (" + reason + ")");
        throw new UnauthorizedException("Invalid email or password");
    }
}