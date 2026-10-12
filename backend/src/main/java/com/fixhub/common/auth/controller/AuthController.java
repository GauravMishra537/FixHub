package com.fixhub.common.auth.controller;

import com.fixhub.common.auth.dto.RegisterRequestDto;
import com.fixhub.common.auth.dto.ResendVerificationRequestDto;
import com.fixhub.common.auth.dto.VerifyEmailRequestDto;
import com.fixhub.common.auth.service.RegistrationService;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.user.dto.UserResponseDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final RegistrationService registrationService;

    public AuthController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponseDto>> register(@Valid @RequestBody RegisterRequestDto requestDto) {
        UserResponseDto userResponse = registrationService.register(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful. Please check your email to verify your account.", userResponse));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@Valid @RequestBody VerifyEmailRequestDto requestDto) {
        registrationService.verifyEmail(requestDto.getToken());
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully. Your account is now pending administrator approval.", null));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<ApiResponse<Void>> verifyEmailByGet(@RequestParam String token) {
        registrationService.verifyEmail(token);
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully. Your account is now pending administrator approval.", null));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Void>> resendVerification(@Valid @RequestBody ResendVerificationRequestDto requestDto) {
        registrationService.resendVerification(requestDto.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Verification link sent successfully.", null));
    }
}
