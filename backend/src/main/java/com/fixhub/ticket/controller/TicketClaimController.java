package com.fixhub.ticket.controller;

import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.ticket.dto.ClaimStateDto;
import com.fixhub.ticket.dto.TicketResponseDto;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.ticket.service.TicketClaimService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets/{id}/claim")
public class TicketClaimController {

    private final TicketClaimService claimService;

    public TicketClaimController(TicketClaimService claimService) {
        this.claimService = claimService;
    }

    // can I claim this ticket, and is my claim waiting?
    @GetMapping
    public ResponseEntity<ApiResponse<ClaimStateDto>> state(
            @PathVariable Long id, @AuthenticationPrincipal AuthUser user, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(claimService.myState(id, actor(user, authentication))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TicketResponseDto>> claim(
            @PathVariable Long id, @AuthenticationPrincipal AuthUser user, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Claim saved",
                claimService.claim(id, actor(user, authentication))));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<TicketResponseDto>> withdraw(
            @PathVariable Long id, @AuthenticationPrincipal AuthUser user, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Claim withdrawn",
                claimService.withdraw(id, actor(user, authentication))));
    }

    // same rule as TicketController: ROLE_ADMIN makes the actor an admin
    private TicketActor actor(AuthUser user, Authentication authentication) {
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return new TicketActor(user.id(), admin);
    }
}