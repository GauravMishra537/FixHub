package com.fixhub.user.controller;

import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.user.dto.RejectSkillRequestDto;
import com.fixhub.user.dto.SkillRequestDto;
import com.fixhub.user.dto.SkillResponseDto;
import com.fixhub.user.dto.SkillReviewResponseDto;
import com.fixhub.user.dto.UserSkillRequestDto;
import com.fixhub.user.dto.UserSkillResponseDto;
import com.fixhub.user.entity.SkillStatus;
import com.fixhub.user.service.SkillService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSkillController {

    private final SkillService skillService;

    public AdminSkillController(SkillService skillService) {
        this.skillService = skillService;
    }

    // ---- catalog ----
    @GetMapping("/skills")
    public ResponseEntity<ApiResponse<List<SkillResponseDto>>> allSkills() {
        return ResponseEntity.ok(ApiResponse.success(skillService.getAllSkills()));
    }

    @PostMapping("/skills")
    public ResponseEntity<ApiResponse<SkillResponseDto>> createSkill(@Valid @RequestBody SkillRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Skill created", skillService.createSkill(request)));
    }

    @PutMapping("/skills/{id}")
    public ResponseEntity<ApiResponse<SkillResponseDto>> updateSkill(@PathVariable Long id,
                                                                     @Valid @RequestBody SkillRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success("Skill updated", skillService.updateSkill(id, request)));
    }

    @DeleteMapping("/skills/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSkill(@PathVariable Long id) {
        skillService.deleteSkill(id);
        return ResponseEntity.ok(ApiResponse.success("Skill deleted", null));
    }

    // ---- review ----
    @GetMapping("/skill-requests")
    public ResponseEntity<ApiResponse<List<SkillReviewResponseDto>>> reviewList(
            @RequestParam(defaultValue = "PENDING") SkillStatus status) {
        return ResponseEntity.ok(ApiResponse.success(skillService.getReviewList(status)));
    }

    @PostMapping("/skill-requests/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approve(@PathVariable Long id,
                                                     @AuthenticationPrincipal AuthUser admin) {
        skillService.approve(id, admin.id());
        return ResponseEntity.ok(ApiResponse.success("Skill approved", null));
    }

    @PostMapping("/skill-requests/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> reject(@PathVariable Long id,
                                                    @AuthenticationPrincipal AuthUser admin,
                                                    @Valid @RequestBody RejectSkillRequestDto request) {
        skillService.reject(id, admin.id(), request.getReason());
        return ResponseEntity.ok(ApiResponse.success("Skill rejected", null));
    }

    // ---- one user's skills ----
    @GetMapping("/users/{userId}/skills")
    public ResponseEntity<ApiResponse<List<UserSkillResponseDto>>> userSkills(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(skillService.getUserSkills(userId)));
    }

    @PostMapping("/users/{userId}/skills")
    public ResponseEntity<ApiResponse<UserSkillResponseDto>> addUserSkill(@PathVariable Long userId,
                                                                          @AuthenticationPrincipal AuthUser admin,
                                                                          @Valid @RequestBody UserSkillRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Skill added", skillService.adminAddSkill(userId, request, admin.id())));
    }

    @DeleteMapping("/users/{userId}/skills/{userSkillId}")
    public ResponseEntity<ApiResponse<Void>> removeUserSkill(@PathVariable Long userId,
                                                             @PathVariable Long userSkillId) {
        skillService.adminRemoveSkill(userId, userSkillId);
        return ResponseEntity.ok(ApiResponse.success("Skill removed", null));
    }
}