package com.fixhub.infra.controller;

import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.ticket.service.TicketActor;
import org.springframework.security.core.Authentication;

/** Who is calling: id from the token, admin from the role. */
final class InfraActors {

    private InfraActors() {
    }

    static TicketActor of(AuthUser user, Authentication authentication) {
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
                return new TicketActor(user.id(), admin);
    }
}