package com.fixhub.common.auth.service.impl;

import com.fixhub.common.audit.service.AuditService;
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

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class RegistrationServiceImpl implements RegistrationService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditService auditService;

    public RegistrationServiceImpl(
            UserRepository userRepository,
            UserMapper userMapper,
            VerificationTokenRepository verificationTokenRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            AuditService auditService
    ) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.auditService = auditService;
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

        String rawToken = UUID.randomUUID().toString();
        String tokenHash = hashToken(rawToken);
        Instant expiryDate = Instant.now().plus(24, ChronoUnit.HOURS);
        VerificationToken verificationToken = new VerificationToken(tokenHash, savedUser, expiryDate);
        verificationTokenRepository.save(verificationToken);

        emailService.sendVerificationEmail(savedUser.getEmail(), savedUser.getFullName(), rawToken);
        auditService.logEvent("USER_REGISTERED", savedUser.getId(), savedUser.getEmail(), "New user account registered");

        return userMapper.toDto(savedUser);
    }

    @Override
    public void verifyEmail(String token) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Verification token is required");
        }

        String raw = token.trim();
        String tokenHash = hashToken(raw);

        VerificationToken verificationToken = verificationTokenRepository.findByToken(tokenHash)
                .or(() -> verificationTokenRepository.findByToken(raw))
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

        auditService.logEvent("EMAIL_VERIFIED", user.getId(), user.getEmail(), "User email verified");
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

        List<VerificationToken> existingTokens = verificationTokenRepository.findAllByUserAndUsedFalse(user);
        for (VerificationToken existingToken : existingTokens) {
            existingToken.setUsed(true);
        }
        verificationTokenRepository.saveAll(existingTokens);

        String rawToken = UUID.randomUUID().toString();
        String tokenHash = hashToken(rawToken);
        Instant expiryDate = Instant.now().plus(24, ChronoUnit.HOURS);
        VerificationToken verificationToken = new VerificationToken(tokenHash, user, expiryDate);
        verificationTokenRepository.save(verificationToken);

        emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), rawToken);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : encodedHash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
