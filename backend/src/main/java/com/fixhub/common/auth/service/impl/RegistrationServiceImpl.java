package com.fixhub.common.auth.service.impl;

import com.fixhub.common.audit.service.AuditService;
import com.fixhub.common.auth.dto.RegisterRequestDto;
import com.fixhub.common.auth.entity.RegistrationRequest;
import com.fixhub.common.auth.entity.RequestStatus;
import com.fixhub.common.auth.entity.VerificationToken;
import com.fixhub.common.auth.repository.RegistrationRequestRepository;
import com.fixhub.common.auth.repository.VerificationTokenRepository;
import com.fixhub.common.auth.service.EmailService;
import com.fixhub.common.auth.service.RegistrationService;
import com.fixhub.common.exception.BadRequestException;
import com.fixhub.user.dto.UserResponseDto;
import com.fixhub.user.entity.Role;
import com.fixhub.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.UUID;

@Service
@Transactional
public class RegistrationServiceImpl implements RegistrationService {

    private final RegistrationRequestRepository requestRepository;
    private final VerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditService auditService;

    @Value("${app.auth.verification-token-expiry-hours:24}")
    private long tokenExpiryHours;

    public RegistrationServiceImpl(RegistrationRequestRepository requestRepository,
                                   VerificationTokenRepository tokenRepository,
                                   UserRepository userRepository,
                                   PasswordEncoder passwordEncoder,
                                   EmailService emailService,
                                   AuditService auditService) {
        this.requestRepository = requestRepository;
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.auditService = auditService;
    }

    @Override
    public UserResponseDto register(RegisterRequestDto requestDto) {
        String email = requestDto.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email is already registered: " + email);
        }
        if (requestRepository.existsByEmailAndRequestStatus(email, RequestStatus.PENDING)) {
            throw new BadRequestException(
                    "A registration for this email is already pending. Check your inbox or request a new verification link.");
        }

        RegistrationRequest request = new RegistrationRequest(
                requestDto.getFullName().trim(),
                email,
                passwordEncoder.encode(requestDto.getPassword()));
        requestRepository.save(request);

        issueToken(request);
        auditService.logEvent("REGISTRATION_REQUESTED", null, email, "Registration request submitted");

        UserResponseDto response = new UserResponseDto();
        response.setEmail(email);
        response.setFullName(request.getFullName());
        response.setRole(Role.USER);
        response.setEmailVerified(false);
        return response;
    }

    @Override
    public void verifyEmail(String token) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Verification token is required");
        }

        VerificationToken verificationToken = tokenRepository.findByToken(hashToken(token.trim()))
                .orElseThrow(() -> new BadRequestException("Invalid or expired verification token"));

        RegistrationRequest request = verificationToken.getRegistrationRequest();

        if (request.isEmailVerified()) {
            return;
        }
        if (verificationToken.isUsed()) {
            throw new BadRequestException("Verification token has already been used");
        }
        if (verificationToken.getExpiryDate().isBefore(Instant.now())) {
            throw new BadRequestException("Verification token has expired");
        }

        verificationToken.setUsed(true);
        request.setEmailVerified(true);
        auditService.logEvent("EMAIL_VERIFIED", null, request.getEmail(), "Email verified");
    }

    @Override
    public void resendVerification(String email) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Email is required");
        }

        requestRepository.findByEmailAndRequestStatus(email.trim().toLowerCase(), RequestStatus.PENDING)
                .filter(request -> !request.isEmailVerified())
                .ifPresent(request -> {
                    tokenRepository.findAllByRegistrationRequestAndUsedFalse(request)
                            .forEach(t -> t.setUsed(true));
                    issueToken(request);
                });
    }

    private void issueToken(RegistrationRequest request) {
        String rawToken = UUID.randomUUID().toString();
        Instant expiry = Instant.now().plus(tokenExpiryHours, ChronoUnit.HOURS);
        tokenRepository.save(new VerificationToken(hashToken(rawToken), request, expiry));
        emailService.sendVerificationEmail(request.getEmail(), request.getFullName(), rawToken);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}