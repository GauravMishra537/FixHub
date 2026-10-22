package com.fixhub.ticket.controller;

import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.common.dto.PageResponse;
import com.fixhub.ticket.dto.TicketCreateRequestDto;
import com.fixhub.ticket.dto.TicketHistoryResponseDto;
import com.fixhub.ticket.dto.TicketListItemDto;
import com.fixhub.ticket.dto.TicketResponseDto;
import com.fixhub.ticket.dto.TicketSummaryDto;
import com.fixhub.ticket.dto.TicketUpdateRequestDto;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.ticket.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Any logged in user. URL rule anyRequest().authenticated() already protects it. */
@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TicketResponseDto>> create(
            @Valid @RequestBody TicketCreateRequestDto request,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        TicketResponseDto created = ticketService.create(request, actor(user, authentication));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ticket created", created));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<TicketListItemDto>>> listVisible(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                ticketService.listVisible(actor(user, authentication), page, size)));
    }

    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<PageResponse<TicketListItemDto>>> listMine(
            @RequestParam(required = false) String group,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                ticketService.listMine(actor(user, authentication), group, page, size)));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<TicketSummaryDto>> summary(
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                ticketService.summary(actor(user, authentication))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TicketResponseDto>> get(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                ticketService.get(id, actor(user, authentication))));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TicketResponseDto>> update(
            @PathVariable Long id,
            @Valid @RequestBody TicketUpdateRequestDto request,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Ticket updated",
                ticketService.update(id, request, actor(user, authentication))));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<TicketHistoryResponseDto>>> history(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                ticketService.history(id, actor(user, authentication))));
    }

    private TicketActor actor(AuthUser user, Authentication authentication) {
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return new TicketActor(user.id(), admin);
    }
}