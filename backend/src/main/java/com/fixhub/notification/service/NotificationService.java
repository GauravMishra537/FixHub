package com.fixhub.notification.service;

import com.fixhub.common.dto.PageResponse;
import com.fixhub.notification.dto.NotificationResponseDto;
import com.fixhub.notification.entity.NotificationType;

import java.util.Collection;

public interface NotificationService {

    // ---------- for the bell ----------

    PageResponse<NotificationResponseDto> list(Long userId, int page, int size);

    long unreadCount(Long userId);

    void markRead(Long id, Long userId);

    void markAllRead(Long userId);

    void clearAll(Long userId);

    // ---------- for other modules ----------

    /** Tell every person in userIds the same thing. Empty or null list does nothing. */
    void notifyUsers(Collection<Long> userIds, NotificationType type, Long ticketId, String message);
}