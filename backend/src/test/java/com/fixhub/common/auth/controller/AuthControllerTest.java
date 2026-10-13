package com.fixhub.common.auth.controller;

import com.fixhub.common.auth.dto.LoginRequestDto;
import com.fixhub.common.auth.dto.LoginResponseDto;
import com.fixhub.common.auth.dto.RegisterRequestDto;
import com.fixhub.common.auth.service.AuthenticationService;
import com.fixhub.common.auth.service.RegistrationService;
import com.fixhub.common.exception.GlobalExceptionHandler;
import com.fixhub.common.exception.UnauthorizedException;
import com.fixhub.user.dto.UserResponseDto;
import com.fixhub.user.entity.AccountStatus;
import com.fixhub.user.entity.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private RegistrationService registrationService;

    @Mock
    private AuthenticationService authenticationService;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(registrationService, authenticationService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void register_ValidRequest_ReturnsCreated() throws Exception {
        UserResponseDto responseDto = new UserResponseDto(
                1L,
                "alex@example.com",
                "Alex Hunter",
                Role.USER,
                AccountStatus.PENDING,
                "Facilities",
                "Manager",
                "5551234567",
                Instant.now(),
                Instant.now()
        );

        when(registrationService.register(any(RegisterRequestDto.class))).thenReturn(responseDto);

        String payload = """
                {
                    "fullName": "Alex Hunter",
                    "email": "alex@example.com",
                    "password": "Password123!"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("alex@example.com"))
                .andExpect(jsonPath("$.data.fullName").value("Alex Hunter"));
    }

    @Test
    void register_InvalidEmail_ReturnsBadRequest() throws Exception {
        String payload = """
                {
                    "fullName": "Alex Hunter",
                    "email": "invalid-email",
                    "password": "Password123!"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void login_ValidCredentials_ReturnsOk() throws Exception {
        UserResponseDto userDto = new UserResponseDto(
                1L,
                "admin@fixhub.com",
                "Admin User",
                Role.ADMIN,
                AccountStatus.ACTIVE,
                "IT",
                "Administrator",
                null,
                Instant.now(),
                Instant.now()
        );
        LoginResponseDto loginResponse = new LoginResponseDto("mock-jwt-token", userDto);

        when(authenticationService.login(any(LoginRequestDto.class))).thenReturn(loginResponse);

        String payload = """
                {
                    "email": "admin@fixhub.com",
                    "password": "AdminPassword123!"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("mock-jwt-token"))
                .andExpect(jsonPath("$.data.user.email").value("admin@fixhub.com"))
                .andExpect(jsonPath("$.data.user.role").value("ADMIN"));
    }

    @Test
    void login_InvalidCredentials_ReturnsUnauthorized() throws Exception {
        when(authenticationService.login(any(LoginRequestDto.class)))
                .thenThrow(new UnauthorizedException("Invalid email or password"));

        String payload = """
                {
                    "email": "admin@fixhub.com",
                    "password": "wrong-password"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void verifyEmail_Post_ReturnsOk() throws Exception {
        doNothing().when(registrationService).verifyEmail("valid-token-123");

        String payload = """
                {
                    "token": "valid-token-123"
                }
                """;

        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Email verified successfully. Your account is now pending administrator approval."));
    }

    @Test
    void verifyEmail_Get_ReturnsOk() throws Exception {
        doNothing().when(registrationService).verifyEmail("valid-token-123");

        mockMvc.perform(get("/api/auth/verify-email?token=valid-token-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Email verified successfully. Your account is now pending administrator approval."));
    }

    @Test
    void resendVerification_ReturnsOk() throws Exception {
        doNothing().when(registrationService).resendVerification("alex@example.com");

        String payload = """
                {
                    "email": "alex@example.com"
                }
                """;

        mockMvc.perform(post("/api/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Verification link sent successfully."));
    }
}
