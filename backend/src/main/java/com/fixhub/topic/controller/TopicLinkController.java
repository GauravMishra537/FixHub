package com.fixhub.topic.controller;

import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.topic.dto.TopicLinkDto;
import com.fixhub.topic.dto.TopicLinkRequestDto;
import com.fixhub.topic.service.TopicLinkService;
import org.springframework.http.HttpStatus;
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

/** Learning material (links) on a topic ticket. Files use the normal attachment endpoints. */
@RestController
@RequestMapping("/api/tickets/{id}/links")
public class TopicLinkController {

    private final TopicLinkService linkService;

    public TopicLinkController(TopicLinkService linkService) {
        this.linkService = linkService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TopicLinkDto>>> list(
            @PathVariable Long id, @AuthenticationPrincipal AuthUser user, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(linkService.list(id, TopicActors.of(user, authentication))));
    }

    // body: { "title": "React docs", "url": "https://react.dev", "kind": "DOCUMENT" }
    @PostMapping
    public ResponseEntity<ApiResponse<TopicLinkDto>> add(
            @PathVariable Long id,
            @RequestBody TopicLinkRequestDto request,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Link added",
                linkService.add(id, request, TopicActors.of(user, authentication))));
    }

    @DeleteMapping("/{linkId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @PathVariable Long linkId,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        linkService.delete(id, linkId, TopicActors.of(user, authentication));
        return ResponseEntity.ok(ApiResponse.success("Link removed", null));
    }
}