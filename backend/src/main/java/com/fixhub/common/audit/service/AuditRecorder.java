package com.fixhub.common.audit.service;

import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.user.entity.User;
import com.fixhub.user.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class AuditRecorder {

    private static final int MAX_DESCRIPTION = 255;

    private final AuditService auditService;
    private final UserRepository userRepository;

    public AuditRecorder(AuditService auditService, UserRepository userRepository) {
        this.auditService = auditService;
        this.userRepository = userRepository;
    }

    /** Logs an event for the currently logged-in user (the actor). */
    public void record(String eventType, String description) {
        Long actorId = null;
        String actorEmail = null;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthUser authUser) {
            actorId = authUser.id();
            actorEmail = userRepository.findById(actorId).map(User::getEmail).orElse(null);
        }
        String text = description != null && description.length() > MAX_DESCRIPTION
                ? description.substring(0, MAX_DESCRIPTION)
                : description;
        auditService.logEvent(eventType, actorId, actorEmail, text);
    }
}