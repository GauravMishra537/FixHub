package com.fixhub.user.service;

import com.fixhub.common.exception.BadRequestException;
import com.fixhub.common.exception.ResourceNotFoundException;
import com.fixhub.user.dto.UserRequestDto;
import com.fixhub.user.dto.UserResponseDto;
import com.fixhub.user.entity.AccountStatus;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import com.fixhub.user.mapper.UserMapper;
import com.fixhub.user.repository.UserRepository;
import com.fixhub.user.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private UserMapper userMapper;
    private UserServiceImpl userService;

    @BeforeEach
    void setUp() {
        userMapper = new UserMapper();
        userService = new UserServiceImpl(userRepository, userMapper, passwordEncoder);
    }

    @Test
    void createUser_Success() {
        UserRequestDto request = new UserRequestDto(
                "john.doe@example.com",
                "Password123!",
                "John Doe",
                "Engineering",
                "Software Engineer",
                "1234567890"
        );

        when(userRepository.existsByEmail("john.doe@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123!")).thenReturn("hashed_password");

        User savedUser = new User("john.doe@example.com", "hashed_password", "John Doe", Role.USER, AccountStatus.PENDING);
        savedUser.setId(1L);
        savedUser.setDepartment("Engineering");
        savedUser.setDesignation("Software Engineer");
        savedUser.setPhoneNumber("1234567890");
        savedUser.setCreatedAt(Instant.now());
        savedUser.setUpdatedAt(Instant.now());

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        UserResponseDto result = userService.createUser(request);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("john.doe@example.com", result.getEmail());
        assertEquals("John Doe", result.getFullName());
        assertEquals(Role.USER, result.getRole());
        assertEquals(AccountStatus.PENDING, result.getStatus());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createUser_DuplicateEmail_ThrowsBadRequestException() {
        UserRequestDto request = new UserRequestDto(
                "john.doe@example.com",
                "Password123!",
                "John Doe",
                "Engineering",
                "Software Engineer",
                "1234567890"
        );

        when(userRepository.existsByEmail("john.doe@example.com")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> userService.createUser(request));
        assertTrue(ex.getMessage().contains("already registered"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void getUserById_Success() {
        User user = new User("alice@example.com", "hash", "Alice Smith", Role.USER, AccountStatus.ACTIVE);
        user.setId(2L);
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));

        UserResponseDto result = userService.getUserById(2L);

        assertNotNull(result);
        assertEquals(2L, result.getId());
        assertEquals("alice@example.com", result.getEmail());
        assertEquals("Alice Smith", result.getFullName());
    }

    @Test
    void getUserById_NotFound_ThrowsResourceNotFoundException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.getUserById(999L));
    }
}
