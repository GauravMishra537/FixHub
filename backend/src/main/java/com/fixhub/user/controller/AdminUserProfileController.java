package com.fixhub.user.controller;

import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.user.dto.UserProfileRequestDto;
import com.fixhub.user.dto.UserProfileResponseDto;
import com.fixhub.user.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users/{userId}/profile")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserProfileController {

    private final UserProfileService userProfileService;

    public AdminUserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<UserProfileResponseDto>> get(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(userProfileService.getProfile(userId)));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserProfileResponseDto>> update(@PathVariable Long userId,
                                                                      @AuthenticationPrincipal AuthUser admin,
                                                                      @Valid @RequestBody UserProfileRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success("Profile updated",
                userProfileService.updateProfile(userId, request, admin.id())));
    }
}