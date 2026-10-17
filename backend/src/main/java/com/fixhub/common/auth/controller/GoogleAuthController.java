package com.fixhub.common.auth.controller;

import com.fixhub.common.auth.dto.GoogleExchangeRequestDto;
import com.fixhub.common.auth.dto.LoginResponseDto;
import com.fixhub.common.auth.oauth.GoogleOAuthService;
import com.fixhub.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/api/auth/google")
public class GoogleAuthController {

    private final GoogleOAuthService googleOAuthService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public GoogleAuthController(GoogleOAuthService googleOAuthService) {
        this.googleOAuthService = googleOAuthService;
    }

    @GetMapping("/start")
    public ResponseEntity<Void> start() {
        if (!googleOAuthService.isConfigured()) {
            return redirect(frontendUrl + "/login?error=GOOGLE_NOT_CONFIGURED");
        }
        return redirect(googleOAuthService.buildAuthorizationUrl());
    }

    @GetMapping("/callback")
    public ResponseEntity<Void> callback(@RequestParam(required = false) String code,
                                         @RequestParam(required = false) String state,
                                         @RequestParam(required = false) String error) {
        GoogleOAuthService.CallbackResult result = googleOAuthService.handleCallback(code, state, error);
        if (result.handoffCode() != null) {
            return redirect(frontendUrl + "/oauth/callback?code=" + result.handoffCode());
        }
        return redirect(frontendUrl + "/login?error=" + result.statusCode());
    }

    @PostMapping("/exchange")
    public ResponseEntity<ApiResponse<LoginResponseDto>> exchange(@Valid @RequestBody GoogleExchangeRequestDto body) {
        return ResponseEntity.ok(ApiResponse.success(googleOAuthService.exchange(body.code())));
    }

    private ResponseEntity<Void> redirect(String url) {
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }
}