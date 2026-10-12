package com.fixhub.common.auth.service.impl;

import com.fixhub.common.auth.dto.RegisterRequestDto;
import com.fixhub.common.auth.entity.VerificationToken;
import com.fixhub.common.auth.repository.VerificationTokenRepository;
import com.fixhub.common.auth.service.EmailService;
import com.fixhub.common.auth.service.RegistrationService;
import com.fixhub.common.exception.BadRequestException;
import com.fixhub.user.dto.UserResponseDto;
import com.fixhub.user.entity.AccountStatus;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import com.fixhub.user.mapper.UserMapper;
import com.fixhub.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@Transactional
public class RegistrationServiceImpl implements RegistrationService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public RegistrationServiceImpl(UserRepository userRepository,
                                   UserMapper userMapper,
                                   VerificationTokenRepository verificationTokenRepository,
                                   PasswordEncoder passwordEncoder,
                                   EmailService emailService) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Override
    public UserResponseDto register(RegisterRequestDto requestDto) {
        String normalizedEmail = requestDto.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("Email is already registered: " + normalizedEmail);
        }

        String encodedPassword = passwordEncoder.encode(requestDto.getPassword());

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(encodedPassword);
        user.setFullName(requestDto.getFullName().trim());
        user.setRole(Role.USER);
        user.setStatus(AccountStatus.PENDING);
        user.setEmailVerified(false);

        User savedUser = userRepository.save(user);

        String token = UUID.randomUUID().toString();
        Instant expiryDate = Instant.now().plus(24, ChronoUnit.HOURS);
        VerificationToken verificationToken = new VerificationToken(token, savedUser, expiryDate);
        verificationTokenRepository.save(verificationToken);

        emailService.sendVerificationEmail(savedUser.getEmail(), savedUser.getFullName(), token);

        return userMapper.toDto(savedUser);
    }

    @Override
    public void verifyEmail(String token) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Verification token is required");
        }

        VerificationToken verificationToken = verificationTokenRepository.findByToken(token.trim())
                .orElseThrow(() -> new BadRequestException("Invalid or expired verification token"));

        if (verificationToken.isUsed()) {
            throw new BadRequestException("Verification token has already been used");
        }

        if (verificationToken.getExpiryDate().isBefore(Instant.now())) {
            throw new BadRequestException("Verification token has expired");
        }

        verificationToken.setUsed(true);
        verificationTokenRepository.save(verificationToken);

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
    }

    @Override
    public void resendVerification(String email) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Email is required");
        }

        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("No account found with email: " + normalizedEmail));

        if (user.isEmailVerified()) {
            throw new BadRequestException("Email is already verified");
        }

        verificationTokenRepository.findByUserAndUsedFalse(user)
                .ifPresent(existingToken -> {
                    existingToken.setUsed(true);
                    verificationTokenRepository.save(existingToken);
                });

        String token = UUID.randomUUID().toString();
        Instant expiryDate = Instant.now().plus(24, ChronoUnit.HOURS);
        VerificationToken verificationToken = new VerificationToken(token, user, expiryDate);
        verificationTokenRepository.save(verificationToken);

        emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), token);
    }
}
