package com.fixhub.infra.controller;

import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.infra.dto.BookingResponseDto;
import com.fixhub.infra.dto.SessionDecisionRequestDto;
import com.fixhub.infra.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Admin decides one session of a request. /api/admin/** is admin only. */
@RestController
@RequestMapping("/api/admin/infra/bookings")
public class InfraSessionAdminController {

    private final BookingService bookingService;

    public InfraSessionAdminController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/{bookingId}/approve")
    public ResponseEntity<ApiResponse<BookingResponseDto>> approve(
            @PathVariable Long bookingId,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Session approved",
                bookingService.approveSession(bookingId, InfraActors.of(user, authentication))));
    }

    @PostMapping("/{bookingId}/reject")
    public ResponseEntity<ApiResponse<BookingResponseDto>> reject(
            @PathVariable Long bookingId,
            @RequestBody SessionDecisionRequestDto request,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Session rejected",
                bookingService.rejectSession(bookingId, request == null ? null : request.note(),
                        InfraActors.of(user, authentication))));
    }
}