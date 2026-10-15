package com.fixhub.common.auth.security;

import java.security.Principal;

public record AuthUser(Long id, String email) implements Principal {
    @Override
    public String getName() {
        return email;
    }
}