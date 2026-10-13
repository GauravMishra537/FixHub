package com.fixhub.common.config;

import com.fixhub.common.auth.security.JwtService;
import com.fixhub.user.entity.AccountStatus;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class SecurityIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JwtService jwtService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
    }

    @Test
    void adminEndpoint_ForbiddenWithoutToken() throws Exception {
        mockMvc.perform(get("/api/admin/overview"))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminEndpoint_ForbiddenForRegularUser() throws Exception {
        User regularUser = new User();
        regularUser.setId(10L);
        regularUser.setEmail("employee@fixhub.com");
        regularUser.setFullName("Regular Employee");
        regularUser.setRole(Role.USER);
        regularUser.setStatus(AccountStatus.ACTIVE);

        String userToken = jwtService.generateToken(regularUser);

        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminEndpoint_AllowedForAdminUser() throws Exception {
        User adminUser = new User();
        adminUser.setId(1L);
        adminUser.setEmail("admin@fixhub.com");
        adminUser.setFullName("System Admin");
        adminUser.setRole(Role.ADMIN);
        adminUser.setStatus(AccountStatus.ACTIVE);

        String adminToken = jwtService.generateToken(adminUser);

        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }
}
