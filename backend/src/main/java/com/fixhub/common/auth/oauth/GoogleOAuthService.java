package com.fixhub.common.auth.oauth;

import com.fixhub.common.audit.service.AuditService;
import com.fixhub.common.auth.dto.LoginResponseDto;
import com.fixhub.common.auth.entity.AuthProvider;
import com.fixhub.common.auth.entity.RegistrationRequest;
import com.fixhub.common.auth.entity.RequestStatus;
import com.fixhub.common.auth.entity.UserIdentity;
import com.fixhub.common.auth.repository.RegistrationRequestRepository;
import com.fixhub.common.auth.repository.UserIdentityRepository;
import com.fixhub.common.auth.security.JwtService;
import com.fixhub.common.exception.BadRequestException;
import com.fixhub.user.entity.User;
import com.fixhub.user.mapper.UserMapper;
import com.fixhub.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

@Service
public class GoogleOAuthService {

    private static final Logger log = LoggerFactory.getLogger(GoogleOAuthService.class);

    private static final String AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
    private static final String SCOPES =
            "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";
    private static final SecureRandom RANDOM = new SecureRandom();

    /** Exactly one field set: handoffCode = login ok, statusCode = login page shows a message. */
    public record CallbackResult(String handoffCode, String statusCode) {
        static CallbackResult success(String handoffCode) {
            return new CallbackResult(handoffCode, null);
        }

        static CallbackResult status(String statusCode) {
            return new CallbackResult(null, statusCode);
        }
    }

    private record GoogleProfile(String subject, String email, boolean emailVerified, String name) {
    }

    private final UserRepository userRepository;
    private final UserIdentityRepository identityRepository;
    private final RegistrationRequestRepository requestRepository;
    private final GoogleAuthStateStore stateStore;
    private final LoginHandoffStore handoffStore;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final AuditService auditService;
    private final RestClient restClient;

    @Value("${app.google.client-id:}")
    private String clientId;

    @Value("${app.google.client-secret:}")
    private String clientSecret;

    @Value("${app.google.redirect-uri:http://localhost:8080/api/auth/google/callback}")
    private String redirectUri;

    public GoogleOAuthService(UserRepository userRepository,
                              UserIdentityRepository identityRepository,
                              RegistrationRequestRepository requestRepository,
                              GoogleAuthStateStore stateStore,
                              LoginHandoffStore handoffStore,
                              JwtService jwtService,
                              UserMapper userMapper,
                              AuditService auditService) {
        this.userRepository = userRepository;
        this.identityRepository = identityRepository;
        this.requestRepository = requestRepository;
        this.stateStore = stateStore;
        this.handoffStore = handoffStore;
        this.jwtService = jwtService;
        this.userMapper = userMapper;
        this.auditService = auditService;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(10));
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    public boolean isConfigured() {
        return !clientId.isBlank() && !clientSecret.isBlank();
    }

    public String buildAuthorizationUrl() {
        String state = randomToken(32);
        String verifier = randomToken(48);
        stateStore.put(state, verifier);

        return UriComponentsBuilder.fromUriString(AUTH_URL)
                .queryParam("client_id", "{clientId}")
                .queryParam("redirect_uri", "{redirectUri}")
                .queryParam("response_type", "code")
                .queryParam("scope", "{scope}")
                .queryParam("state", "{state}")
                .queryParam("code_challenge", "{challenge}")
                .queryParam("code_challenge_method", "S256")
                .queryParam("prompt", "select_account")
                .encode()
                .buildAndExpand(Map.of(
                        "clientId", clientId,
                        "redirectUri", redirectUri,
                        "scope", SCOPES,
                        "state", state,
                        "challenge", challenge(verifier)))
                .toUriString();
    }

    @Transactional
    public CallbackResult handleCallback(String code, String state, String error) {
        Optional<String> verifier = stateStore.consume(state);
        if (verifier.isEmpty()) {
            return CallbackResult.status("STATE_INVALID");
        }
        if (error != null) {
            return CallbackResult.status("GOOGLE_CANCELLED");
        }
        if (code == null || code.isBlank()) {
            return CallbackResult.status("STATE_INVALID");
        }

        GoogleProfile profile;
        try {
            profile = fetchProfile(exchangeCode(code, verifier.get()));
        } catch (RestClientException | IllegalStateException e) {
            log.warn("Google sign-in failed: {}", e.getMessage());
            return CallbackResult.status("GOOGLE_FAILED");
        }

        if (!profile.emailVerified()) {
            return CallbackResult.status("EMAIL_NOT_VERIFIED");
        }

        // 1. Google id already linked: login
        Optional<UserIdentity> identity = identityRepository
                .findByProviderAndProviderSubject(AuthProvider.GOOGLE, profile.subject());
        if (identity.isPresent()) {
            Optional<User> user = userRepository.findById(identity.get().getUserId());
            if (user.isEmpty()) {
                return CallbackResult.status("ACCOUNT_REMOVED");
            }
            return login(user.get());
        }

        // 2. Registered and approved user (email match): link Google, login
        Optional<User> existing = userRepository.findByEmail(profile.email());
        if (existing.isPresent()) {
            User user = existing.get();
            if (!identityRepository.findByUserId(user.getId()).isEmpty()) {
                return CallbackResult.status("GOOGLE_MISMATCH"); // other Google account already linked
            }
            identityRepository.save(new UserIdentity(user.getId(), AuthProvider.GOOGLE, profile.subject()));
            auditService.logEvent("GOOGLE_LINKED", user.getId(), user.getEmail(),
                    "Google account linked on first Google sign-in");
            return login(user);
        }

        // 3. Request already pending
        Optional<RegistrationRequest> pending =
                requestRepository.findByEmailAndRequestStatus(profile.email(), RequestStatus.PENDING);
        if (pending.isPresent()) {
            RegistrationRequest request = pending.get();
            if (request.getGoogleSubject() == null) {
                request.setGoogleSubject(profile.subject());
            }
            request.setEmailVerified(true);
            return CallbackResult.status("PENDING_APPROVAL");
        }

        // 4. New email: create request, wait for admin
        RegistrationRequest request = new RegistrationRequest(displayName(profile), profile.email(), null);
        request.setEmailVerified(true);
        request.setGoogleSubject(profile.subject());
        requestRepository.save(request);
        auditService.logEvent("REGISTRATION_REQUESTED", null, profile.email(),
                "Registration request submitted with Google");
        return CallbackResult.status("REQUEST_CREATED");
    }

    @Transactional(readOnly = true)
    public LoginResponseDto exchange(String handoffCode) {
        Long userId = handoffStore.consume(handoffCode)
                .orElseThrow(() -> new BadRequestException("Invalid or expired sign-in code"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("Account is not available"));
        return new LoginResponseDto(jwtService.generateToken(user), userMapper.toDto(user));
    }

    private CallbackResult login(User user) {
        user.setLastLoginAt(Instant.now());
        auditService.logEvent("LOGIN_SUCCESS", user.getId(), user.getEmail(), "User logged in with Google");
        return CallbackResult.success(handoffStore.issue(user.getId()));
    }

    private String exchangeCode(String code, String verifier) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code);
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("redirect_uri", redirectUri);
        form.add("grant_type", "authorization_code");
        form.add("code_verifier", verifier);

        Map<String, Object> body = restClient.post()
                .uri(TOKEN_URL)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(new ParameterizedTypeReference<Map<String, Object>>() {
                });

        Object token = body == null ? null : body.get("access_token");
        if (token == null) {
            throw new IllegalStateException("No access token in Google response");
        }
        return token.toString();
    }

    private GoogleProfile fetchProfile(String accessToken) {
        Map<String, Object> body = restClient.get()
                .uri(USERINFO_URL)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(new ParameterizedTypeReference<Map<String, Object>>() {
                });

        if (body == null || body.get("id") == null || body.get("email") == null) {
            throw new IllegalStateException("Incomplete Google profile");
        }
        return new GoogleProfile(
                body.get("id").toString(),
                body.get("email").toString().trim().toLowerCase(),
                Boolean.TRUE.equals(body.get("verified_email")),
                body.get("name") == null ? "" : body.get("name").toString().trim());
    }

    private String displayName(GoogleProfile profile) {
        String name = profile.name().isBlank()
                ? profile.email().substring(0, profile.email().indexOf('@'))
                : profile.name();
        return name.length() > 100 ? name.substring(0, 100) : name;
    }

    private String randomToken(int bytes) {
        byte[] data = new byte[bytes];
        RANDOM.nextBytes(data);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }

    private String challenge(String verifier) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(verifier.getBytes(StandardCharsets.US_ASCII));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}