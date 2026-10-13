package com.fixhub.common.auth.controller;

import com.fixhub.common.auth.dto.LoginRequestDto;
import com.fixhub.common.auth.dto.LoginResponseDto;
import com.fixhub.common.auth.dto.RegisterRequestDto;
import com.fixhub.common.auth.dto.ResendVerificationRequestDto;
import com.fixhub.common.auth.dto.VerifyEmailRequestDto;
import com.fixhub.common.auth.service.AuthenticationService;
import com.fixhub.common.auth.service.RegistrationService;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.common.exception.UnauthorizedException;
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

import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final RegistrationService registrationService;
    private final AuthenticationService authenticationService;

    public AuthController(
            RegistrationService registrationService,
            AuthenticationService authenticationService
    ) {
        this.registrationService = registrationService;
        this.authenticationService = authenticationService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponseDto>> register(@Valid @RequestBody RegisterRequestDto requestDto) {
        UserResponseDto userResponse = registrationService.register(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful. Please check your email to verify your account.", userResponse));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponseDto>> login(@Valid @RequestBody LoginRequestDto requestDto) {
        LoginResponseDto response = authenticationService.login(requestDto);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponseDto>> getCurrentUser(Principal principal) {
        if (principal == null) {
            throw new UnauthorizedException("User not authenticated");
        }
        UserResponseDto user = authenticationService.getCurrentUser(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(user));
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
