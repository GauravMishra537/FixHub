package com.fixhub.notification.service.impl;

import com.fixhub.common.dto.PageResponse;
import com.fixhub.notification.dto.NotificationResponseDto;
import com.fixhub.notification.entity.Notification;
import com.fixhub.notification.entity.NotificationType;
import com.fixhub.notification.repository.NotificationRepository;
import com.fixhub.notification.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final int DEFAULT_SIZE = 10;
    private static final int MAX_SIZE = 50;
    private static final int MAX_MESSAGE = 255;

    private final NotificationRepository repository;

    public NotificationServiceImpl(NotificationRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponseDto> list(Long userId, int page, int size) {
        int safeSize = size <= 0 ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);
        Page<Notification> result = repository.findByUserIdOrderByCreatedOnDescIdDesc(
                userId, PageRequest.of(Math.max(page, 0), safeSize));
        return PageResponse.of(result, this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return repository.countByUserIdAndReadOnIsNull(userId);
    }

    @Override
    @Transactional
    public void markRead(Long id, Long userId) {
        Notification n = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (n.getReadOn() == null) {
            n.setReadOn(Instant.now());
            repository.save(n);
        }
    }

    @Override
    @Transactional
    public void markAllRead(Long userId) {
        repository.markAllRead(userId, Instant.now());
    }

    @Override
    @Transactional
    public void clearAll(Long userId) {
        repository.clearAll(userId, Instant.now());
    }

    @Override
    @Transactional
    public void notifyUsers(Collection<Long> userIds, NotificationType type, Long ticketId, String message) {
        if (userIds == null || userIds.isEmpty()) {
            return;
        }
        String text = message.length() > MAX_MESSAGE ? message.substring(0, MAX_MESSAGE) : message;

        List<Notification> rows = userIds.stream().distinct().map(userId -> {
            Notification n = new Notification();
            n.setUserId(userId);
            n.setType(type);
            n.setTicketId(ticketId);
            n.setMessage(text);
            return n;
        }).toList();
        repository.saveAll(rows);
    }

    private NotificationResponseDto toDto(Notification n) {
        return new NotificationResponseDto(
                n.getId(), n.getType(), n.getTicketId(), n.getMessage(),
                n.getReadOn() != null, n.getCreatedOn());
    }
}