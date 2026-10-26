package com.fixhub.ticket.controller;

import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.common.dto.PageResponse;
import com.fixhub.ticket.dto.TicketCategoryCountDto;
import com.fixhub.ticket.dto.TicketCreateRequestDto;
import com.fixhub.ticket.dto.TicketHistoryResponseDto;
import com.fixhub.ticket.dto.TicketListItemDto;
import com.fixhub.ticket.dto.TicketResponseDto;
import com.fixhub.ticket.dto.TicketSearchRequestDto;
import com.fixhub.ticket.dto.TicketSummaryDto;
import com.fixhub.ticket.dto.TicketUpdateRequestDto;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.ticket.service.TicketService;
import com.fixhub.ticket.dto.TicketWorkStatsDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
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

    // all tickets this user may see. optional: q, type, status, categoryId, priority, departmentId,
    // assigneeId, createdFrom, createdTo, mineOnly, group, sortBy, direction, page, size
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<TicketListItemDto>>> list(
            @Valid @ModelAttribute TicketSearchRequestDto request,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                ticketService.search(request, actor(user, authentication))));
    }

    // same filters, but only tickets this user raised
    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<PageResponse<TicketListItemDto>>> listMine(
            @Valid @ModelAttribute TicketSearchRequestDto request,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        request.setMineOnly(true);
        return ResponseEntity.ok(ApiResponse.success(
                ticketService.search(request, actor(user, authentication))));
    }
    
    @GetMapping("/department-queue")
    public ResponseEntity<ApiResponse<PageResponse<TicketListItemDto>>> departmentQueue(
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                ticketService.departmentQueue(actor(user, authentication), page, size)));
    }

    // categories with ticket counts, for the filter chips
    @GetMapping("/category-counts")
    public ResponseEntity<ApiResponse<List<TicketCategoryCountDto>>> categoryCounts(
            @RequestParam(defaultValue = "ISSUE") TicketType type,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                ticketService.categoryCounts(type, actor(user, authentication))));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<TicketSummaryDto>> summary(
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                ticketService.summary(actor(user, authentication))));
    }

        @GetMapping("/work-stats")
    public ResponseEntity<ApiResponse<TicketWorkStatsDto>> workStats(
            @AuthenticationPrincipal AuthUser user, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(ticketService.workStats(actor(user, authentication))));
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