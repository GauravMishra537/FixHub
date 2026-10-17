package com.fixhub.common.auth.oauth;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class GoogleAuthStateStore {

    private static final Duration TTL = Duration.ofMinutes(10);

    private record Entry(String codeVerifier, Instant expiresAt) {
    }

    private final Map<String, Entry> entries = new ConcurrentHashMap<>();

    public void put(String state, String codeVerifier) {
        Instant now = Instant.now();
        entries.values().removeIf(e -> e.expiresAt().isBefore(now));
        entries.put(state, new Entry(codeVerifier, now.plus(TTL)));
    }

    /** Removes the state, so it works once. */
    public Optional<String> consume(String state) {
        if (state == null) {
            return Optional.empty();
        }
        Entry entry = entries.remove(state);
        if (entry == null || entry.expiresAt().isBefore(Instant.now())) {
            return Optional.empty();
        }
        return Optional.of(entry.codeVerifier());
    }
}