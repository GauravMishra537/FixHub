package com.fixhub.common.auth.bootstrap;

import com.fixhub.common.auth.bootstrap.impl.AdminBootstrapServiceImpl;
import com.fixhub.user.entity.AccountStatus;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import com.fixhub.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminBootstrapServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AdminBootstrapServiceImpl adminBootstrapService;

    @BeforeEach
    void setUp() {
        adminBootstrapService = new AdminBootstrapServiceImpl(userRepository, passwordEncoder);
    }

    @Test
    void bootstrapAdmin_Success_CreatesAdminWithHashedPassword() {
        when(userRepository.existsByRole(Role.ADMIN)).thenReturn(false);
        when(userRepository.existsByEmail("admin@fixhub.com")).thenReturn(false);
        when(passwordEncoder.encode("SecureAdminPass123!")).thenReturn("hashed-bcrypt-value");

        boolean result = adminBootstrapService.bootstrapAdmin(
                "admin@fixhub.com",
                "SecureAdminPass123!",
                "Initial Administrator"
        );

        assertTrue(result);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());

        User savedUser = captor.getValue();
        assertEquals("admin@fixhub.com", savedUser.getEmail());
        assertEquals("hashed-bcrypt-value", savedUser.getPasswordHash());
        assertNotEquals("SecureAdminPass123!", savedUser.getPasswordHash());
        assertEquals(Role.ADMIN, savedUser.getRole());
        assertEquals(AccountStatus.ACTIVE, savedUser.getStatus());
        assertTrue(savedUser.isEmailVerified());
        assertEquals("Initial Administrator", savedUser.getFullName());
    }

    @Test
    void bootstrapAdmin_Refused_WhenAdminAlreadyExists() {
        when(userRepository.existsByRole(Role.ADMIN)).thenReturn(true);

        boolean result = adminBootstrapService.bootstrapAdmin(
                "another.admin@fixhub.com",
                "SecureAdminPass123!",
                "Second Admin"
        );

        assertFalse(result);
        verify(userRepository, never()).save(any());
    }

    @Test
    void bootstrapAdmin_Refused_WhenEmailBelongsToExistingUser() {
        when(userRepository.existsByRole(Role.ADMIN)).thenReturn(false);
        when(userRepository.existsByEmail("existing@fixhub.com")).thenReturn(true);

        boolean result = adminBootstrapService.bootstrapAdmin(
                "existing@fixhub.com",
                "SecureAdminPass123!",
                "Existing User"
        );

        assertFalse(result);
        verify(userRepository, never()).save(any());
    }

    @Test
    void bootstrapAdmin_Fails_WhenConfigurationMissing() {
        assertFalse(adminBootstrapService.bootstrapAdmin("", "SecurePass123!", "Admin"));
        assertFalse(adminBootstrapService.bootstrapAdmin(null, "SecurePass123!", "Admin"));
        assertFalse(adminBootstrapService.bootstrapAdmin("admin@fixhub.com", "", "Admin"));
        assertFalse(adminBootstrapService.bootstrapAdmin("admin@fixhub.com", null, "Admin"));
        assertFalse(adminBootstrapService.bootstrapAdmin("admin@fixhub.com", "short", "Admin"));
        assertFalse(adminBootstrapService.bootstrapAdmin("invalid-email", "SecurePass123!", "Admin"));

        verify(userRepository, never()).save(any());
    }

    @Test
    void runner_Executes_WhenOptInCommandLineArgumentProvided() {
        AdminBootstrapService mockService = mock(AdminBootstrapService.class);
        AdminBootstrapRunner runner = new AdminBootstrapRunner(mockService);
        ReflectionTestUtils.setField(runner, "propertyEnabled", false);

        runner.run(new DefaultApplicationArguments("--app.bootstrap-admin=true"));

        verify(mockService, times(1)).bootstrapAdmin();
    }

    @Test
    void runner_DoesNotExecute_WhenDisabled() {
        AdminBootstrapService mockService = mock(AdminBootstrapService.class);
        AdminBootstrapRunner runner = new AdminBootstrapRunner(mockService);
        ReflectionTestUtils.setField(runner, "propertyEnabled", false);

        runner.run(new DefaultApplicationArguments());

        verify(mockService, never()).bootstrapAdmin();
    }
}
