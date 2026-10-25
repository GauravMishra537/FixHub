package com.fixhub.ticket.controller;

import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.ticket.dto.ClaimRejectRequestDto;
import com.fixhub.ticket.dto.TicketAssignRequestDto;
import com.fixhub.ticket.dto.TicketClaimResponseDto;
import com.fixhub.ticket.dto.TicketResponseDto;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.ticket.service.TicketClaimService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/tickets/{id}")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTicketClaimController {

    private final TicketClaimService claimService;

    public AdminTicketClaimController(TicketClaimService claimService) {
        this.claimService = claimService;
    }

    @GetMapping("/claims")
    public ResponseEntity<ApiResponse<List<TicketClaimResponseDto>>> claims(
            @PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(ApiResponse.success(claimService.claims(id, admin(user))));
    }

    @PostMapping("/claims/{claimId}/approve")
    public ResponseEntity<ApiResponse<TicketResponseDto>> approve(
            @PathVariable Long id, @PathVariable Long claimId, @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(ApiResponse.success("Claim approved",
                claimService.approveClaim(id, claimId, admin(user))));
    }

    @PostMapping("/claims/{claimId}/reject")
    public ResponseEntity<ApiResponse<TicketResponseDto>> reject(
            @PathVariable Long id, @PathVariable Long claimId,
            @Valid @RequestBody ClaimRejectRequestDto request, @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(ApiResponse.success("Claim rejected",
                claimService.rejectClaim(id, claimId, request.getReason(), admin(user))));
    }

    @PutMapping("/assignee")
    public ResponseEntity<ApiResponse<TicketResponseDto>> assign(
            @PathVariable Long id, @Valid @RequestBody TicketAssignRequestDto request,
            @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(ApiResponse.success("Ticket assigned",
                claimService.assign(id, request.getUserId(), admin(user))));
    }

    @DeleteMapping("/assignee")
    public ResponseEntity<ApiResponse<TicketResponseDto>> unassign(
            @PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(ApiResponse.success("Ticket taken back",
                claimService.unassign(id, admin(user))));
    }

    private TicketActor admin(AuthUser user) {
        return new TicketActor(user.id(), true);
    }
}