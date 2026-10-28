package com.fixhub.ticket.controller;

import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.ticket.dto.AttachmentLinkDto;
import com.fixhub.ticket.dto.AttachmentResponseDto;
import com.fixhub.ticket.dto.AttachmentStartRequestDto;
import com.fixhub.ticket.dto.AttachmentStartResponseDto;
import com.fixhub.ticket.dto.PartLinkDto;
import com.fixhub.ticket.dto.PartLinksRequestDto;
import com.fixhub.ticket.dto.UploadStatusDto;
import com.fixhub.ticket.service.AttachmentService;
import com.fixhub.ticket.service.TicketActor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Files on a ticket. The bytes never pass through here: the browser sends parts straight to the
 * storage with signed links. This controller only hands out those links and keeps the records.
 */
@RestController
@RequestMapping("/api/tickets/{id}/attachments")
public class AttachmentController {

    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    // finished files of the ticket
    @GetMapping
    public ResponseEntity<ApiResponse<List<AttachmentResponseDto>>> list(
            @PathVariable Long id, @AuthenticationPrincipal AuthUser user, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(attachmentService.list(id, actor(user, authentication))));
    }

    // 1. start. body: { "fileName": "screenshot.png", "sizeBytes": 1048576 }
    @PostMapping
    public ResponseEntity<ApiResponse<AttachmentStartResponseDto>> start(
            @PathVariable Long id,
            @Valid @RequestBody AttachmentStartRequestDto request,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Upload started",
                attachmentService.start(id, request, actor(user, authentication))));
    }

    // 2. links for the parts to send. body: { "partNumbers": [1, 2, 3] }
    @PostMapping("/{attachmentId}/part-links")
    public ResponseEntity<ApiResponse<List<PartLinkDto>>> partLinks(
            @PathVariable Long id,
            @PathVariable Long attachmentId,
            @Valid @RequestBody PartLinksRequestDto request,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                attachmentService.partLinks(id, attachmentId, request.getPartNumbers(), actor(user, authentication))));
    }

    // what the storage already holds. the browser sends only the rest. this is the resume
    @GetMapping("/{attachmentId}/status")
    public ResponseEntity<ApiResponse<UploadStatusDto>> status(
            @PathVariable Long id,
            @PathVariable Long attachmentId,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                attachmentService.status(id, attachmentId, actor(user, authentication))));
    }

    // 3. all parts are sent: join them and check the file
    @PostMapping("/{attachmentId}/complete")
    public ResponseEntity<ApiResponse<AttachmentResponseDto>> complete(
            @PathVariable Long id,
            @PathVariable Long attachmentId,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("File uploaded",
                attachmentService.complete(id, attachmentId, actor(user, authentication))));
    }

    // cancel an upload that is not finished
    @PostMapping("/{attachmentId}/abort")
    public ResponseEntity<ApiResponse<Void>> abort(
            @PathVariable Long id,
            @PathVariable Long attachmentId,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        attachmentService.abort(id, attachmentId, actor(user, authentication));
        return ResponseEntity.ok(ApiResponse.success("Upload cancelled", null));
    }

    // a short link. inline=true is for the viewer, otherwise the file downloads
    @GetMapping("/{attachmentId}/download-link")
    public ResponseEntity<ApiResponse<AttachmentLinkDto>> downloadLink(
            @PathVariable Long id,
            @PathVariable Long attachmentId,
            @RequestParam(defaultValue = "false") boolean inline,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                attachmentService.downloadLink(id, attachmentId, inline, actor(user, authentication))));
    }

    // soft delete of a finished file
    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @PathVariable Long attachmentId,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        attachmentService.delete(id, attachmentId, actor(user, authentication));
        return ResponseEntity.ok(ApiResponse.success("File deleted", null));
    }

    // same rule as TicketController: ROLE_ADMIN makes the actor an admin
    private TicketActor actor(AuthUser user, Authentication authentication) {
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return new TicketActor(user.id(), admin);
    }
}