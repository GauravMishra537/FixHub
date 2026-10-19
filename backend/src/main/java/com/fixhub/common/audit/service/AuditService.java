package com.fixhub.common.audit.service;

import com.fixhub.common.audit.entity.AuditLog;
import org.springframework.data.domain.Page;

import java.util.List;

public interface AuditService {

    void logEvent(String eventType, Long userId, String userEmail, String description, String ipAddress);

    void logEvent(String eventType, Long userId, String userEmail, String description);

    List<AuditLog> getLogsByUserId(Long userId);

    List<AuditLog> getLogsByEventType(String eventType);

    Page<AuditLog> search(String eventType, Long userId, int page, int size);
}