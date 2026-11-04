package com.fixhub.resource.controller;

import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.resource.dto.CatalogGroupDto;
import com.fixhub.resource.dto.ResourceApprovalDto;
import com.fixhub.resource.dto.ResourceRequestDetailDto;
import com.fixhub.resource.dto.ResourceRequestDto;
import com.fixhub.resource.dto.ResourceRequestResultDto;
import com.fixhub.resource.dto.ResourceSettingsDto;
import com.fixhub.resource.dto.ResourceSettingsRequestDto;
import com.fixhub.resource.service.ResourceQueryService;
import com.fixhub.resource.service.ResourceRequestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Any logged in user. anyRequest().authenticated() already protects it. */
@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceRequestService requestService;
    private final ResourceQueryService queryService;

    public ResourceController(ResourceRequestService requestService, ResourceQueryService queryService) {
        this.requestService = requestService;
        this.queryService = queryService;
    }

    // the request page: what can be asked for, with the stock left
    @GetMapping("/catalog")
    public ResponseEntity<ApiResponse<List<CatalogGroupDto>>> catalog() {
        return ResponseEntity.ok(ApiResponse.success(queryService.catalog()));
    }

    // the request form: one ticket for one item
    @PostMapping("/requests")
    public ResponseEntity<ApiResponse<ResourceRequestResultDto>> create(
            @RequestBody ResourceRequestDto request,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        ResourceRequestResultDto created = requestService.create(request, ResourceActors.of(user, authentication));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Request sent", created));
    }

    // the Request card on the ticket page
    @GetMapping("/tickets/{ticketId}")
    public ResponseEntity<ApiResponse<ResourceRequestDetailDto>> details(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                queryService.details(ticketId, ResourceActors.of(user, authentication))));
    }

    // priority and visibility. author or admin, while the ticket is not finished
    @PatchMapping("/tickets/{ticketId}/settings")
    public ResponseEntity<ApiResponse<ResourceSettingsDto>> settings(
            @PathVariable Long ticketId,
            @RequestBody ResourceSettingsRequestDto request,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Saved",
                requestService.updateSettings(ticketId, request, ResourceActors.of(user, authentication))));
    }

    // My queue: requests waiting for me at the department step
    @GetMapping("/approvals")
    public ResponseEntity<ApiResponse<List<ResourceApprovalDto>>> approvals(
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                queryService.approvals(ResourceActors.of(user, authentication))));
    }

    // the number for the navbar badge
    @GetMapping("/approvals/count")
    public ResponseEntity<ApiResponse<Long>> approvalCount(
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                queryService.approvalCount(ResourceActors.of(user, authentication))));
    }
}