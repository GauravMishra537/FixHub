package com.fixhub.common.auth.controller;

import com.fixhub.common.auth.dto.ForgotPasswordRequestDto;
import com.fixhub.common.auth.dto.ResetPasswordRequestDto;
import com.fixhub.common.auth.dto.SetPasswordRequestDto;
import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.common.auth.service.PasswordRecoveryService;
import com.fixhub.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PasswordRecoveryController {

    private final PasswordRecoveryService passwordRecoveryService;

    public PasswordRecoveryController(PasswordRecoveryService passwordRecoveryService) {
        this.passwordRecoveryService = passwordRecoveryService;
    }

    @PostMapping("/auth/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDto body) {
        passwordRecoveryService.forgotPassword(body.email());
        return ResponseEntity.ok(ApiResponse.success(
                "If that email is registered, a reset link has been sent.", null));
    }

    @PostMapping("/auth/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequestDto body) {
        passwordRecoveryService.resetPassword(body.token(), body.newPassword());
        return ResponseEntity.ok(ApiResponse.success("Password updated. You can log in now.", null));
    }

    // Under /api/account so SecurityConfig's anyRequest().authenticated() protects it.
    @PostMapping("/account/set-password")
    public ResponseEntity<ApiResponse<Void>> setPassword(@Valid @RequestBody SetPasswordRequestDto body,
                                                         @AuthenticationPrincipal AuthUser actor) {
        passwordRecoveryService.setPassword(actor.id(), body.newPassword());
        return ResponseEntity.ok(ApiResponse.success("Password set.", null));
    }
}