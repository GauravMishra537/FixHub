package com.fixhub.user.service;

import com.fixhub.user.dto.SkillRequestDto;
import com.fixhub.user.dto.SkillResponseDto;
import com.fixhub.user.dto.SkillReviewResponseDto;
import com.fixhub.user.dto.UserSkillRequestDto;
import com.fixhub.user.dto.UserSkillResponseDto;
import com.fixhub.user.entity.SkillStatus;

import java.util.List;

public interface SkillService {

    // catalog
    List<SkillResponseDto> getActiveSkills();

    List<SkillResponseDto> getAllSkills();

    SkillResponseDto createSkill(SkillRequestDto request);

    SkillResponseDto updateSkill(Long id, SkillRequestDto request);

    void deleteSkill(Long id);

    // user side
    List<UserSkillResponseDto> getUserSkills(Long userId);

    UserSkillResponseDto requestSkill(Long userId, UserSkillRequestDto request);

    void removeOwnSkill(Long userId, Long userSkillId);

    // admin review
    List<SkillReviewResponseDto> getReviewList(SkillStatus status);

    void approve(Long userSkillId, Long adminId);

    void reject(Long userSkillId, Long adminId, String reason);

    // admin manages a user's skills directly
    UserSkillResponseDto adminAddSkill(Long userId, UserSkillRequestDto request, Long adminId);

    void adminRemoveSkill(Long userId, Long userSkillId);
}