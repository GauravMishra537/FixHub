package com.fixhub.common.auth.service.impl;

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

    public AuthenticationServiceImpl(
            UserRepository userRepository,
            UserMapper userMapper,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Override
    public LoginResponseDto login(LoginRequestDto requestDto) {
        String normalizedEmail = requestDto.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(requestDto.getPassword(), user.getPasswordHash())) {
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
            throw new BadRequestException("Your account request was rejected. Please contact your system administrator.");
        }

        String token = jwtService.generateToken(user);
        UserResponseDto userDto = userMapper.toDto(user);

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
