package com.fixhub.ticket.controller;

import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.ticket.dto.TicketResponseDto;
import com.fixhub.ticket.dto.TicketTransitionRequestDto;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.ticket.service.TicketWorkflowService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets/{id}/transition")
public class TicketWorkflowController {

    private final TicketWorkflowService workflowService;

    public TicketWorkflowController(TicketWorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    // body: { "action": "RESOLVE", "note": "Replaced the cable", "version": 3 }
    @PostMapping
    public ResponseEntity<ApiResponse<TicketResponseDto>> transition(
            @PathVariable Long id,
            @Valid @RequestBody TicketTransitionRequestDto request,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Ticket updated",
                workflowService.transition(id, request, actor(user, authentication))));
    }

    // same rule as TicketController: ROLE_ADMIN makes the actor an admin
    private TicketActor actor(AuthUser user, Authentication authentication) {
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return new TicketActor(user.id(), admin);
    }
}