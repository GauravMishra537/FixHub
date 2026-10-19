package com.fixhub.common.audit.service.impl;

import com.fixhub.common.audit.entity.AuditLog;
import com.fixhub.common.audit.repository.AuditLogRepository;
import com.fixhub.common.audit.service.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditServiceImpl implements AuditService {

    private static final Logger logger = LoggerFactory.getLogger(AuditServiceImpl.class);
    private static final int MAX_PAGE_SIZE = 100;

    private final AuditLogRepository auditLogRepository;

    public AuditServiceImpl(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    @Transactional
    public void logEvent(String eventType, Long userId, String userEmail, String description, String ipAddress) {
        AuditLog auditLog = new AuditLog(eventType, userId, userEmail, description, ipAddress);
        auditLogRepository.save(auditLog);
        logger.info("[AUDIT] Event: {}, User: {} ({}), Description: {}", eventType, userEmail, userId, description);
    }

    @Override
    @Transactional
    public void logEvent(String eventType, Long userId, String userEmail, String description) {
        logEvent(eventType, userId, userEmail, description, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> getLogsByUserId(Long userId) {
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> getLogsByEventType(String eventType) {
        return auditLogRepository.findByEventTypeOrderByCreatedAtDesc(eventType);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLog> search(String eventType, Long userId, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        String type = (eventType == null || eventType.isBlank()) ? null : eventType.trim();
        return auditLogRepository.search(type, userId, pageable);
    }
}