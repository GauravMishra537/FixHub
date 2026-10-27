package com.fixhub.ticket.controller;

import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.ticket.dto.CommentRequestDto;
import com.fixhub.ticket.dto.CommentResponseDto;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.ticket.service.TicketCommentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tickets/{id}/comments")
public class TicketCommentController {

    private final TicketCommentService commentService;

    public TicketCommentController(TicketCommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommentResponseDto>>> list(
            @PathVariable Long id, @AuthenticationPrincipal AuthUser user, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(commentService.list(id, actor(user, authentication))));
    }

    // body: { "body": "Tried restarting, same error" }
    @PostMapping
    public ResponseEntity<ApiResponse<CommentResponseDto>> add(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequestDto request,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Comment added",
                commentService.add(id, request, actor(user, authentication))));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @PathVariable Long commentId,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        commentService.delete(id, commentId, actor(user, authentication));
        return ResponseEntity.ok(ApiResponse.success("Comment deleted", null));
    }

    // same rule as TicketController: ROLE_ADMIN makes the actor an admin
    private TicketActor actor(AuthUser user, Authentication authentication) {
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return new TicketActor(user.id(), admin);
    }
}