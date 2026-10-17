package com.fixhub.common.auth.oauth;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

// One-time code so the JWT never travels in a URL.
@Component
public class LoginHandoffStore {

    private static final Duration TTL = Duration.ofSeconds(60);
    private static final SecureRandom RANDOM = new SecureRandom();

    private record Entry(Long userId, Instant expiresAt) {
    }

    private final Map<String, Entry> entries = new ConcurrentHashMap<>();

    public String issue(Long userId) {
        Instant now = Instant.now();
        entries.values().removeIf(e -> e.expiresAt().isBefore(now));
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String code = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        entries.put(code, new Entry(userId, now.plus(TTL)));
        return code;
    }

    public Optional<Long> consume(String code) {
        if (code == null) {
            return Optional.empty();
        }
        Entry entry = entries.remove(code);
        if (entry == null || entry.expiresAt().isBefore(Instant.now())) {
            return Optional.empty();
        }
        return Optional.of(entry.userId());
    }
}