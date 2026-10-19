package com.fixhub.user.controller;

import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.user.dto.SkillResponseDto;
import com.fixhub.user.dto.UserSkillRequestDto;
import com.fixhub.user.dto.UserSkillResponseDto;
import com.fixhub.user.service.SkillService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api")
public class SkillController {

    private final SkillService skillService;

    public SkillController(SkillService skillService) {
        this.skillService = skillService;
    }

    @GetMapping("/skills")
    public ResponseEntity<ApiResponse<List<SkillResponseDto>>> activeSkills() {
        return ResponseEntity.ok(ApiResponse.success(skillService.getActiveSkills()));
    }

    @GetMapping("/account/skills")
    public ResponseEntity<ApiResponse<List<UserSkillResponseDto>>> mySkills(@AuthenticationPrincipal AuthUser me) {
        return ResponseEntity.ok(ApiResponse.success(skillService.getUserSkills(me.id())));
    }

    @PostMapping("/account/skills")
    public ResponseEntity<ApiResponse<UserSkillResponseDto>> requestSkill(@AuthenticationPrincipal AuthUser me,
                                                                          @Valid @RequestBody UserSkillRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Skill sent for admin review", skillService.requestSkill(me.id(), request)));
    }

    @DeleteMapping("/account/skills/{userSkillId}")
    public ResponseEntity<ApiResponse<Void>> removeMySkill(@AuthenticationPrincipal AuthUser me,
                                                           @PathVariable Long userSkillId) {
        skillService.removeOwnSkill(me.id(), userSkillId);
        return ResponseEntity.ok(ApiResponse.success("Skill removed", null));
    }
}