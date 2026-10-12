package com.fixhub.common.auth.service;

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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
                emailService
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

        verify(verificationTokenRepository).save(any(VerificationToken.class));
        verify(emailService).sendVerificationEmail(eq("sarah@example.com"), eq("Sarah Connor"), anyString());
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
        verify(userRepository, never()).save(any(User.class));
        verify(emailService, never()).sendVerificationEmail(any(), any(), any());
    }

    @Test
    void verifyEmail_Success() {
        User user = new User("user@example.com", "hash", "User", Role.USER, AccountStatus.PENDING);
        user.setEmailVerified(false);

        VerificationToken token = new VerificationToken("valid-token", user, Instant.now().plus(1, ChronoUnit.HOURS));

        when(verificationTokenRepository.findByToken("valid-token")).thenReturn(Optional.of(token));

        registrationService.verifyEmail("valid-token");

        assertTrue(token.isUsed());
        assertTrue(user.isEmailVerified());
        verify(verificationTokenRepository).save(token);
        verify(userRepository).save(user);
    }

    @Test
    void verifyEmail_InvalidToken_ThrowsBadRequestException() {
        when(verificationTokenRepository.findByToken("non-existent")).thenReturn(Optional.empty());

        assertThrows(BadRequestException.class, () -> registrationService.verifyEmail("non-existent"));
    }

    @Test
    void verifyEmail_AlreadyUsedToken_ThrowsBadRequestException() {
        User user = new User("user@example.com", "hash", "User", Role.USER, AccountStatus.PENDING);
        VerificationToken token = new VerificationToken("used-token", user, Instant.now().plus(1, ChronoUnit.HOURS));
        token.setUsed(true);

        when(verificationTokenRepository.findByToken("used-token")).thenReturn(Optional.of(token));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> registrationService.verifyEmail("used-token"));
        assertTrue(ex.getMessage().contains("already been used"));
    }

    @Test
    void verifyEmail_ExpiredToken_ThrowsBadRequestException() {
        User user = new User("user@example.com", "hash", "User", Role.USER, AccountStatus.PENDING);
        VerificationToken token = new VerificationToken("expired-token", user, Instant.now().minus(1, ChronoUnit.HOURS));

        when(verificationTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(token));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> registrationService.verifyEmail("expired-token"));
        assertTrue(ex.getMessage().contains("expired"));
    }

    @Test
    void resendVerification_Success() {
        User user = new User("resend@example.com", "hash", "Resend User", Role.USER, AccountStatus.PENDING);
        user.setEmailVerified(false);

        when(userRepository.findByEmail("resend@example.com")).thenReturn(Optional.of(user));
        when(verificationTokenRepository.findByUserAndUsedFalse(user)).thenReturn(Optional.empty());

        registrationService.resendVerification("resend@example.com");

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
