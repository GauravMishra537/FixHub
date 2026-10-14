package com.fixhub.user.controller;

import com.fixhub.common.dto.ApiResponse;
import com.fixhub.user.dto.AdminOverviewDto;
import com.fixhub.user.dto.RejectUserRequestDto;
import com.fixhub.user.dto.UserResponseDto;
import com.fixhub.user.entity.AccountStatus;
import com.fixhub.user.entity.Role;
import com.fixhub.user.repository.UserRepository;
import com.fixhub.user.service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final AdminUserService adminUserService;

    public AdminController(UserRepository userRepository, AdminUserService adminUserService) {
        this.userRepository = userRepository;
        this.adminUserService = adminUserService;
    }

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<AdminOverviewDto>> getOverview() {
        AdminOverviewDto overview = new AdminOverviewDto(
                userRepository.count(),
                userRepository.countByStatus(AccountStatus.ACTIVE),
                userRepository.countByStatus(AccountStatus.PENDING),
                userRepository.countByRole(Role.ADMIN),
                "OPERATIONAL"
        );
        return ResponseEntity.ok(ApiResponse.success(overview));
    }

    @GetMapping("/pending-users")
    public ResponseEntity<ApiResponse<List<UserResponseDto>>> getPendingUsers() {
        return ResponseEntity.ok(ApiResponse.success(adminUserService.listUsers(AccountStatus.PENDING)));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponseDto>>> getUsers(
            @RequestParam(required = false) AccountStatus status) {
        return ResponseEntity.ok(ApiResponse.success(adminUserService.listUsers(status)));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserResponseDto>> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminUserService.getUser(id)));
    }

    @PutMapping("/users/{id}/approve")
    public ResponseEntity<ApiResponse<UserResponseDto>> approve(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("User approved", adminUserService.approve(id, principal.getName())));
    }

    @PutMapping("/users/{id}/reject")
    public ResponseEntity<ApiResponse<UserResponseDto>> reject(@PathVariable Long id,
                                                               @Valid @RequestBody RejectUserRequestDto body,
                                                               Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("User rejected", adminUserService.reject(id, body.getReason(), principal.getName())));
    }

    @PutMapping("/users/{id}/suspend")
    public ResponseEntity<ApiResponse<UserResponseDto>> suspend(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("User suspended", adminUserService.suspend(id, principal.getName())));
    }

    @PutMapping("/users/{id}/restore")
    public ResponseEntity<ApiResponse<UserResponseDto>> restore(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("User restored", adminUserService.restore(id, principal.getName())));
    }
}