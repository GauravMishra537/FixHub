package com.fixhub.user.controller;

import com.fixhub.common.exception.GlobalExceptionHandler;
import com.fixhub.common.exception.ResourceNotFoundException;
import com.fixhub.user.dto.UserRequestDto;
import com.fixhub.user.dto.UserResponseDto;
import com.fixhub.user.entity.AccountStatus;
import com.fixhub.user.entity.Role;
import com.fixhub.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new UserController(userService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void createUser_ValidRequest_ReturnsCreated() throws Exception {
        UserResponseDto responseDto = new UserResponseDto(
                1L,
                "jane.doe@example.com",
                "Jane Doe",
                Role.USER,
                AccountStatus.PENDING,
                "IT",
                "DevOps",
                "9876543210",
                Instant.now(),
                Instant.now()
        );

        when(userService.createUser(any(UserRequestDto.class))).thenReturn(responseDto);

        String jsonPayload = """
                {
                    "email": "jane.doe@example.com",
                    "password": "ValidPassword123!",
                    "fullName": "Jane Doe",
                    "department": "IT",
                    "designation": "DevOps",
                    "phoneNumber": "9876543210"
                }
                """;

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("User created successfully"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.email").value("jane.doe@example.com"))
                .andExpect(jsonPath("$.data.role").value("USER"))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    void createUser_InvalidEmail_ReturnsBadRequest() throws Exception {
        String invalidPayload = """
                {
                    "email": "not-an-email",
                    "password": "ValidPassword123!",
                    "fullName": "Jane Doe"
                }
                """;

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void getUserById_Found_ReturnsOk() throws Exception {
        UserResponseDto responseDto = new UserResponseDto(
                1L,
                "jane.doe@example.com",
                "Jane Doe",
                Role.USER,
                AccountStatus.PENDING,
                "IT",
                "DevOps",
                "9876543210",
                Instant.now(),
                Instant.now()
        );

        when(userService.getUserById(1L)).thenReturn(responseDto);

        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("jane.doe@example.com"));
    }

    @Test
    void getUserById_NotFound_ReturnsNotFound() throws Exception {
        when(userService.getUserById(999L)).thenThrow(new ResourceNotFoundException("User not found with id: 999"));

        mockMvc.perform(get("/api/users/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("User not found with id: 999"));
    }

    @Test
    void getAllUsers_ReturnsList() throws Exception {
        UserResponseDto responseDto = new UserResponseDto(
                1L,
                "jane.doe@example.com",
                "Jane Doe",
                Role.USER,
                AccountStatus.PENDING,
                "IT",
                "DevOps",
                "9876543210",
                Instant.now(),
                Instant.now()
        );

        when(userService.getAllUsers()).thenReturn(List.of(responseDto));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].email").value("jane.doe@example.com"));
    }
}
