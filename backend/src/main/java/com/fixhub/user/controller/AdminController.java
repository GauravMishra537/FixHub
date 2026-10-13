package com.fixhub.user.controller;

import com.fixhub.common.dto.ApiResponse;
import com.fixhub.user.dto.AdminOverviewDto;
import com.fixhub.user.dto.UserResponseDto;
import com.fixhub.user.entity.AccountStatus;
import com.fixhub.user.entity.Role;
import com.fixhub.user.mapper.UserMapper;
import com.fixhub.user.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public AdminController(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<AdminOverviewDto>> getOverview() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.findByStatus(AccountStatus.ACTIVE).size();
        long pendingUsers = userRepository.findByStatus(AccountStatus.PENDING).size();
        long adminCount = userRepository.countByRole(Role.ADMIN);

        AdminOverviewDto overview = new AdminOverviewDto(
                totalUsers,
                activeUsers,
                pendingUsers,
                adminCount,
                "OPERATIONAL"
        );

        return ResponseEntity.ok(ApiResponse.success(overview));
    }

    @GetMapping("/pending-users")
    public ResponseEntity<ApiResponse<List<UserResponseDto>>> getPendingUsers() {
        List<UserResponseDto> pendingUsers = userRepository.findByStatus(AccountStatus.PENDING).stream()
                .map(userMapper::toDto)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(pendingUsers));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponseDto>>> getAllUsers() {
        List<UserResponseDto> allUsers = userRepository.findAll().stream()
                .map(userMapper::toDto)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(allUsers));
    }
}
