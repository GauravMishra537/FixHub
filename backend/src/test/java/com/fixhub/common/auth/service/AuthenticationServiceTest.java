package com.fixhub.common.auth.service;

import com.fixhub.common.audit.service.AuditService;
import com.fixhub.common.auth.dto.LoginRequestDto;
import com.fixhub.common.auth.dto.LoginResponseDto;
import com.fixhub.common.auth.security.JwtService;
import com.fixhub.common.auth.service.impl.AuthenticationServiceImpl;
import com.fixhub.common.exception.BadRequestException;
import com.fixhub.common.exception.UnauthorizedException;
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

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuditService auditService;

    private UserMapper userMapper;
    private AuthenticationServiceImpl authenticationService;

    @BeforeEach
    void setUp() {
        userMapper = new UserMapper();
        authenticationService = new AuthenticationServiceImpl(
                userRepository,
                userMapper,
                passwordEncoder,
                jwtService,
                auditService
        );
    }

    private User createTestUser(Role role, AccountStatus status, boolean verified) {
        User user = new User();
        user.setId(1L);
        user.setEmail("admin@fixhub.com");
        user.setPasswordHash("hashedPassword");
        user.setFullName("Admin User");
        user.setRole(role);
        user.setStatus(status);
        user.setEmailVerified(verified);
        return user;
    }

    @Test
    void login_Success_ReturnsTokenAndUserDetails() {
        User user = createTestUser(Role.ADMIN, AccountStatus.ACTIVE, true);
        when(userRepository.findByEmail("admin@fixhub.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("AdminPass123!", "hashedPassword")).thenReturn(true);
        when(jwtService.generateToken(any(User.class))).thenReturn("valid-jwt-token");

        LoginResponseDto response = authenticationService.login(
                new LoginRequestDto("admin@fixhub.com", "AdminPass123!")
        );

        assertNotNull(response);
        assertEquals("valid-jwt-token", response.getAccessToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals("admin@fixhub.com", response.getUser().getEmail());
        assertEquals(Role.ADMIN, response.getUser().getRole());
        verify(auditService).logEvent(eq("LOGIN_SUCCESS"), eq(1L), eq("admin@fixhub.com"), anyString());
    }

    @Test
    void login_InvalidPassword_ThrowsUnauthorizedException() {
        User user = createTestUser(Role.ADMIN, AccountStatus.ACTIVE, true);
        when(userRepository.findByEmail("admin@fixhub.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPass", "hashedPassword")).thenReturn(false);

        assertThrows(UnauthorizedException.class, () ->
                authenticationService.login(new LoginRequestDto("admin@fixhub.com", "WrongPass"))
        );
        verify(auditService).logEvent(eq("LOGIN_FAILED"), eq(1L), eq("admin@fixhub.com"), anyString());
    }

    @Test
    void login_UnknownEmail_ThrowsUnauthorizedException() {
        when(userRepository.findByEmail("nonexistent@fixhub.com")).thenReturn(Optional.empty());

        assertThrows(UnauthorizedException.class, () ->
                authenticationService.login(new LoginRequestDto("nonexistent@fixhub.com", "SomePass123!"))
        );
        verify(auditService).logEvent(eq("LOGIN_FAILED"), isNull(), eq("nonexistent@fixhub.com"), anyString());
    }

    @Test
    void login_UnverifiedEmail_ThrowsBadRequestException() {
        User user = createTestUser(Role.USER, AccountStatus.ACTIVE, false);
        when(userRepository.findByEmail("user@fixhub.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Pass123!", "hashedPassword")).thenReturn(true);

        assertThrows(BadRequestException.class, () ->
                authenticationService.login(new LoginRequestDto("user@fixhub.com", "Pass123!"))
        );
    }

    @Test
    void login_PendingStatus_ThrowsBadRequestException() {
        User user = createTestUser(Role.USER, AccountStatus.PENDING, true);
        when(userRepository.findByEmail("user@fixhub.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Pass123!", "hashedPassword")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                authenticationService.login(new LoginRequestDto("user@fixhub.com", "Pass123!"))
        );
        assertTrue(ex.getMessage().contains("pending administrator approval"));
    }

    @Test
    void login_SuspendedStatus_ThrowsBadRequestException() {
        User user = createTestUser(Role.USER, AccountStatus.SUSPENDED, true);
        when(userRepository.findByEmail("user@fixhub.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Pass123!", "hashedPassword")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                authenticationService.login(new LoginRequestDto("user@fixhub.com", "Pass123!"))
        );
        assertTrue(ex.getMessage().contains("suspended"));
    }
}
