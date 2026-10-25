package com.fixhub.notification.controller;

import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.common.dto.PageResponse;
import com.fixhub.notification.dto.NotificationResponseDto;
import com.fixhub.notification.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** The bell. Every logged in person sees only their own notifications. */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponseDto>>> list(
            @AuthenticationPrincipal AuthUser user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.list(user.id(), page, size)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> unreadCount(@AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(ApiResponse.success(service.unreadCount(user.id())));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
        service.markRead(id, user.id());
        return ResponseEntity.ok(ApiResponse.success("Marked as read", null));
    }

    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(@AuthenticationPrincipal AuthUser user) {
        service.markAllRead(user.id());
        return ResponseEntity.ok(ApiResponse.success("All marked as read", null));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearAll(@AuthenticationPrincipal AuthUser user) {
        service.clearAll(user.id());
        return ResponseEntity.ok(ApiResponse.success("Notifications cleared", null));
    }
}