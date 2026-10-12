package com.fixhub.common.auth.controller;

import com.fixhub.common.auth.dto.RegisterRequestDto;
import com.fixhub.common.auth.service.RegistrationService;
import com.fixhub.common.exception.GlobalExceptionHandler;
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

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(registrationService))
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
                    "password": "SecurePassword123!"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Registration successful. Please check your email to verify your account."))
                .andExpect(jsonPath("$.data.email").value("alex@example.com"))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    void register_InvalidEmail_ReturnsBadRequest() throws Exception {
        String payload = """
                {
                    "fullName": "Alex Hunter",
                    "email": "invalid-email-format",
                    "password": "SecurePassword123!"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void register_ShortPassword_ReturnsBadRequest() throws Exception {
        String payload = """
                {
                    "fullName": "Alex Hunter",
                    "email": "alex@example.com",
                    "password": "short"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
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
