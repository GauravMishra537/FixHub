package com.fixhub.common.auth.service;

import com.fixhub.common.audit.service.AuditService;
import com.fixhub.common.auth.dto.RegisterRequestDto;
import com.fixhub.common.auth.entity.VerificationToken;
import com.fixhub.common.auth.repository.VerificationTokenRepository;
import com.fixhub.common.auth.service.impl.RegistrationServiceImpl;
import com.fixhub.common.exception.BadRequestException;
import com.fixhub.user.dto.UserResponseDto;
import com.fixhub.user.entity.AccountStatus;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import com.fixhub.user.mapper.UserMapper;
import com.fixhub.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private VerificationTokenRepository verificationTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    @Mock
    private AuditService auditService;

    private UserMapper userMapper;
    private RegistrationServiceImpl registrationService;

    @BeforeEach
    void setUp() {
        userMapper = new UserMapper();
        registrationService = new RegistrationServiceImpl(
                userRepository,
                userMapper,
                verificationTokenRepository,
                passwordEncoder,
                emailService,
                auditService
        );
    }

    @Test
    void register_Success() {
        RegisterRequestDto request = new RegisterRequestDto(
                "Sarah Connor",
                "sarah@example.com",
                "StrongPassword123!"
        );

        when(userRepository.existsByEmail("sarah@example.com")).thenReturn(false);
        when(passwordEncoder.encode("StrongPassword123!")).thenReturn("hashed_pass");

        User savedUser = new User("sarah@example.com", "hashed_pass", "Sarah Connor", Role.USER, AccountStatus.PENDING);
        savedUser.setId(10L);
        savedUser.setEmailVerified(false);

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        UserResponseDto response = registrationService.register(request);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("sarah@example.com", response.getEmail());
        assertEquals("Sarah Connor", response.getFullName());
        assertFalse(response.isEmailVerified());
        assertEquals(AccountStatus.PENDING, response.getStatus());

        ArgumentCaptor<VerificationToken> tokenCaptor = ArgumentCaptor.forClass(VerificationToken.class);
        verify(verificationTokenRepository).save(tokenCaptor.capture());
        assertNotNull(tokenCaptor.getValue().getToken());
        // Verify token is hashed with SHA-256 (64 hex characters)
        assertEquals(64, tokenCaptor.getValue().getToken().length());

        verify(emailService).sendVerificationEmail(eq("sarah@example.com"), eq("Sarah Connor"), anyString());
        verify(auditService).logEvent(eq("USER_REGISTERED"), eq(10L), eq("sarah@example.com"), anyString());
    }

    @Test
    void register_DuplicateEmail_ThrowsBadRequestException() {
        RegisterRequestDto request = new RegisterRequestDto(
                "Sarah Connor",
                "sarah@example.com",
                "StrongPassword123!"
        );

        when(userRepository.existsByEmail("sarah@example.com")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> registrationService.register(request));
        assertTrue(ex.getMessage().contains("already registered"));
        verify(userRepository, never()).save(any());
    }

    @Test
    void verifyEmail_Success() {
        User user = new User("user@example.com", "hash", "User", Role.USER, AccountStatus.PENDING);
        user.setId(20L);
        user.setEmailVerified(false);

        VerificationToken token = new VerificationToken("hashed-token-value", user, Instant.now().plus(1, ChronoUnit.HOURS));

        when(verificationTokenRepository.findByToken(anyString())).thenReturn(Optional.of(token));

        registrationService.verifyEmail("raw-token");

        assertTrue(token.isUsed());
        assertTrue(user.isEmailVerified());
        assertEquals(AccountStatus.PENDING, user.getStatus()); // Does NOT auto-activate account
        verify(verificationTokenRepository).save(token);
        verify(userRepository).save(user);
        verify(auditService).logEvent(eq("EMAIL_VERIFIED"), eq(20L), eq("user@example.com"), anyString());
    }

    @Test
    void verifyEmail_InvalidToken_ThrowsBadRequestException() {
        when(verificationTokenRepository.findByToken(anyString())).thenReturn(Optional.empty());

        assertThrows(BadRequestException.class, () -> registrationService.verifyEmail("non-existent"));
    }

    @Test
    void verifyEmail_AlreadyUsedToken_ThrowsBadRequestException() {
        User user = new User("user@example.com", "hash", "User", Role.USER, AccountStatus.PENDING);
        VerificationToken token = new VerificationToken("used-token", user, Instant.now().plus(1, ChronoUnit.HOURS));
        token.setUsed(true);

        when(verificationTokenRepository.findByToken(anyString())).thenReturn(Optional.of(token));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> registrationService.verifyEmail("used-token"));
        assertTrue(ex.getMessage().contains("already been used"));
    }

    @Test
    void verifyEmail_ExpiredToken_ThrowsBadRequestException() {
        User user = new User("user@example.com", "hash", "User", Role.USER, AccountStatus.PENDING);
        VerificationToken token = new VerificationToken("expired-token", user, Instant.now().minus(1, ChronoUnit.HOURS));

        when(verificationTokenRepository.findByToken(anyString())).thenReturn(Optional.of(token));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> registrationService.verifyEmail("expired-token"));
        assertTrue(ex.getMessage().contains("expired"));
    }

    @Test
    void resendVerification_InvalidatesPreviousTokens_AndSendsNew() {
        User user = new User("resend@example.com", "hash", "Resend User", Role.USER, AccountStatus.PENDING);
        user.setEmailVerified(false);

        VerificationToken oldToken1 = new VerificationToken("old-token-1", user, Instant.now().plus(10, ChronoUnit.HOURS));
        VerificationToken oldToken2 = new VerificationToken("old-token-2", user, Instant.now().plus(10, ChronoUnit.HOURS));

        when(userRepository.findByEmail("resend@example.com")).thenReturn(Optional.of(user));
        when(verificationTokenRepository.findAllByUserAndUsedFalse(user)).thenReturn(List.of(oldToken1, oldToken2));

        registrationService.resendVerification("resend@example.com");

        assertTrue(oldToken1.isUsed());
        assertTrue(oldToken2.isUsed());
        verify(verificationTokenRepository).saveAll(List.of(oldToken1, oldToken2));
        verify(verificationTokenRepository).save(any(VerificationToken.class));
        verify(emailService).sendVerificationEmail(eq("resend@example.com"), eq("Resend User"), anyString());
    }

    @Test
    void resendVerification_AlreadyVerified_ThrowsBadRequestException() {
        User user = new User("verified@example.com", "hash", "Verified User", Role.USER, AccountStatus.PENDING);
        user.setEmailVerified(true);

        when(userRepository.findByEmail("verified@example.com")).thenReturn(Optional.of(user));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> registrationService.resendVerification("verified@example.com"));
        assertTrue(ex.getMessage().contains("already verified"));
    }
}
