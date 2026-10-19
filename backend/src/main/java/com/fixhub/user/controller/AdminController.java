package com.fixhub.user.controller;

import com.fixhub.common.auth.entity.RequestStatus;
import com.fixhub.common.auth.repository.RegistrationRequestRepository;
import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.user.dto.AdminOverviewDto;
import com.fixhub.user.dto.RegistrationRequestDto;
import com.fixhub.user.dto.RejectUserRequestDto;
import com.fixhub.user.dto.UserResponseDto;
import com.fixhub.user.entity.Role;
import com.fixhub.user.repository.UserRepository;
import com.fixhub.user.service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.fixhub.user.dto.UserProfileRequestDto;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final RegistrationRequestRepository requestRepository;
    private final AdminUserService adminUserService;

    public AdminController(UserRepository userRepository,
                           RegistrationRequestRepository requestRepository,
                           AdminUserService adminUserService) {
        this.userRepository = userRepository;
        this.requestRepository = requestRepository;
        this.adminUserService = adminUserService;
    }

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<AdminOverviewDto>> getOverview() {
        long users = userRepository.count();
        AdminOverviewDto overview = new AdminOverviewDto(
                users,
                users,
                requestRepository.countByRequestStatus(RequestStatus.PENDING),
                userRepository.countByRole(Role.ADMIN),
                "OPERATIONAL"
        );
        return ResponseEntity.ok(ApiResponse.success(overview));
    }

    @GetMapping("/requests")
    public ResponseEntity<ApiResponse<List<RegistrationRequestDto>>> getRequests(
            @RequestParam(required = false) RequestStatus status) {
        return ResponseEntity.ok(ApiResponse.success(adminUserService.listRequests(status)));
    }

        @PutMapping("/requests/{id}/approve")
    public ResponseEntity<ApiResponse<UserResponseDto>> approve(@PathVariable Long id,
                                                                @RequestBody(required = false) @Valid UserProfileRequestDto details,
                                                                @AuthenticationPrincipal AuthUser actor) {
        return ResponseEntity.ok(ApiResponse.success("User approved",
                adminUserService.approve(id, details, actor.id())));
    }

    @PutMapping("/requests/{id}/reject")
    public ResponseEntity<ApiResponse<RegistrationRequestDto>> reject(@PathVariable Long id,
                                                                       @Valid @RequestBody RejectUserRequestDto body,
                                                                       @AuthenticationPrincipal AuthUser actor) {
        return ResponseEntity.ok(ApiResponse.success("Request rejected",
                adminUserService.reject(id, body.getReason(), actor.id())));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponseDto>>> getUsers() {
        return ResponseEntity.ok(ApiResponse.success(adminUserService.listUsers()));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id,
                                                        @AuthenticationPrincipal AuthUser actor) {
        adminUserService.deleteUser(id, actor.id());
        return ResponseEntity.ok(ApiResponse.success("User deleted", null));
    }
}