package com.fixhub.user.controller;

import com.fixhub.common.exception.GlobalExceptionHandler;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserRepository userRepository;

    private UserMapper userMapper;

    @BeforeEach
    void setUp() {
        userMapper = new UserMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(new AdminController(userRepository, userMapper))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void getOverview_ReturnsMetrics() throws Exception {
        when(userRepository.count()).thenReturn(5L);
        when(userRepository.findByStatus(AccountStatus.ACTIVE)).thenReturn(List.of(new User()));
        when(userRepository.findByStatus(AccountStatus.PENDING)).thenReturn(List.of(new User(), new User()));
        when(userRepository.countByRole(Role.ADMIN)).thenReturn(1L);

        mockMvc.perform(get("/api/admin/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalUsers").value(5))
                .andExpect(jsonPath("$.data.activeUsers").value(1))
                .andExpect(jsonPath("$.data.pendingUsers").value(2))
                .andExpect(jsonPath("$.data.adminCount").value(1))
                .andExpect(jsonPath("$.data.systemStatus").value("OPERATIONAL"));
    }
}
