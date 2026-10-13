package com.fixhub.common.audit.service;

import com.fixhub.common.audit.entity.AuditLog;
import com.fixhub.common.audit.repository.AuditLogRepository;
import com.fixhub.common.audit.service.impl.AuditServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    private AuditServiceImpl auditService;

    @BeforeEach
    void setUp() {
        auditService = new AuditServiceImpl(auditLogRepository);
    }

    @Test
    void logEvent_SavesAuditLogSuccessfully() {
        auditService.logEvent("USER_REGISTERED", 5L, "user@example.com", "Registered new user", "127.0.0.1");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository, times(1)).save(captor.capture());

        AuditLog saved = captor.getValue();
        assertNotNull(saved);
        assertEquals("USER_REGISTERED", saved.getEventType());
        assertEquals(5L, saved.getUserId());
        assertEquals("user@example.com", saved.getUserEmail());
        assertEquals("Registered new user", saved.getDescription());
        assertEquals("127.0.0.1", saved.getIpAddress());
    }

    @Test
    void getLogsByUserId_ReturnsUserLogs() {
        when(auditLogRepository.findByUserIdOrderByCreatedAtDesc(5L))
                .thenReturn(List.of(new AuditLog("LOGIN_SUCCESS", 5L, "user@example.com", "Login", null)));

        List<AuditLog> logs = auditService.getLogsByUserId(5L);

        assertEquals(1, logs.size());
        assertEquals("LOGIN_SUCCESS", logs.get(0).getEventType());
    }
}
