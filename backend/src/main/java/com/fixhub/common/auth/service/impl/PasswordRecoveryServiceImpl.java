package com.fixhub.common.auth.service.impl;

import com.fixhub.common.audit.service.AuditService;
import com.fixhub.common.auth.security.TokenHasher;
import com.fixhub.common.auth.service.EmailService;
import com.fixhub.common.auth.service.PasswordRecoveryService;
import com.fixhub.common.exception.BadRequestException;
import com.fixhub.common.exception.ResourceNotFoundException;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import com.fixhub.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@Transactional
public class PasswordRecoveryServiceImpl implements PasswordRecoveryService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditService auditService;

    @Value("${app.auth.reset-token-expiry-minutes:30}")
    private long resetExpiryMinutes;

    public PasswordRecoveryServiceImpl(UserRepository userRepository,
                                       PasswordEncoder passwordEncoder,
                                       EmailService emailService,
                                       AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.auditService = auditService;
    }

    @Override
    public void forgotPassword(String email) {
        // Always silent: same outcome for unknown, deleted, admin and normal accounts.
        userRepository.findByEmail(email.trim().toLowerCase())
                .filter(user -> user.getRole() != Role.ADMIN)
                .ifPresent(user -> {
                    String rawToken = UUID.randomUUID().toString();
                    // Overwrites any older link: one live link per user.
                    user.setPasswordResetTokenHash(TokenHasher.sha256(rawToken));
                    user.setPasswordResetExpiresAt(Instant.now().plus(resetExpiryMinutes, ChronoUnit.MINUTES));
                    user.setPasswordResetUsedAt(null);
                    userRepository.save(user);

                    emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), rawToken);
                    auditService.logEvent("PASSWORD_RESET_REQUESTED", user.getId(), user.getEmail(),
                            "Password reset link requested");
                });
    }

    @Override
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByPasswordResetTokenHash(TokenHasher.sha256(token.trim()))
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset link"));

        if (user.getRole() == Role.ADMIN
                || user.getPasswordResetUsedAt() != null
                || user.getPasswordResetExpiresAt() == null
                || user.getPasswordResetExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Invalid or expired reset link");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordResetUsedAt(Instant.now());
        user.setPasswordResetTokenHash(null);
        user.setPasswordResetExpiresAt(null);
        userRepository.save(user);

        auditService.logEvent("PASSWORD_RESET", user.getId(), user.getEmail(), "Password reset completed");
    }

    @Override
    public void setPassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getPasswordHash() != null) {
            throw new BadRequestException("A password is already set. Use 'Forgot password' to change it.");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        auditService.logEvent("PASSWORD_SET", user.getId(), user.getEmail(), "Password set for account");
    }
}