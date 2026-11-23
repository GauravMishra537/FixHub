package com.fixhub.topic.controller;

import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.topic.dto.TopicChipDto;
import com.fixhub.topic.dto.TopicHelpersDto;
import com.fixhub.topic.dto.TopicQueueItemDto;
import com.fixhub.topic.dto.TopicRequestDto;
import com.fixhub.topic.dto.TopicRequestResultDto;
import com.fixhub.topic.dto.TopicSkillDto;
import com.fixhub.topic.service.TopicHelperService;
import com.fixhub.topic.service.TopicReadService;
import com.fixhub.topic.service.TopicRequestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Any logged in user. anyRequest().authenticated() already protects it. */
@RestController
@RequestMapping("/api/topics")
public class TopicController {

    private final TopicRequestService requestService;
    private final TopicHelperService helperService;
    private final TopicReadService readService;

    public TopicController(TopicRequestService requestService,
                           TopicHelperService helperService,
                           TopicReadService readService) {
        this.requestService = requestService;
        this.helperService = helperService;
        this.readService = readService;
    }

    // the topic request form: one ticket for one problem
    @PostMapping("/requests")
    public ResponseEntity<ApiResponse<TopicRequestResultDto>> create(
            @RequestBody TopicRequestDto request,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        TopicRequestResultDto created = requestService.create(request, TopicActors.of(user, authentication));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Request sent", created));
    }

    // topics for the form, each with how many others can help
    @GetMapping("/skills")
    public ResponseEntity<ApiResponse<List<TopicSkillDto>>> skills(
            @AuthenticationPrincipal AuthUser user, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(readService.skills(TopicActors.of(user, authentication))));
    }

    // the topics of one ticket
    @GetMapping("/requests/{ticketId}/topics")
    public ResponseEntity<ApiResponse<List<TopicChipDto>>> topics(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                readService.topicsOf(ticketId, TopicActors.of(user, authentication))));
    }

    // admin: the people the "Assign helper" picker shows
    @GetMapping("/requests/{ticketId}/helpers")
    public ResponseEntity<ApiResponse<TopicHelpersDto>> helpers(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Helpers",
                helperService.candidates(ticketId, TopicActors.of(user, authentication))));
    }

    // "Questions you can help with" in My queue
    @GetMapping("/queue")
    public ResponseEntity<ApiResponse<List<TopicQueueItemDto>>> queue(
            @AuthenticationPrincipal AuthUser user, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(readService.queue(TopicActors.of(user, authentication))));
    }

    // the number for the navbar badge
    @GetMapping("/queue/count")
    public ResponseEntity<ApiResponse<Long>> queueCount(
            @AuthenticationPrincipal AuthUser user, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(readService.queueCount(TopicActors.of(user, authentication))));
    }
}