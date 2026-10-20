package com.fixhub.user.controller;

import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.user.dto.AccountProfileRequestDto;
import com.fixhub.user.dto.UserResponseDto;
import com.fixhub.user.service.AccountProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account/profile")
public class AccountProfileController {

    private final AccountProfileService accountProfileService;

    public AccountProfileController(AccountProfileService accountProfileService) {
        this.accountProfileService = accountProfileService;
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserResponseDto>> update(@AuthenticationPrincipal AuthUser me,
                                                               @Valid @RequestBody AccountProfileRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success("Profile updated", accountProfileService.updateMyProfile(me.id(), request)));
    }
}