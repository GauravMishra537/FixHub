package com.fixhub.user.mapper;

import com.fixhub.user.dto.SkillResponseDto;
import com.fixhub.user.dto.SkillReviewResponseDto;
import com.fixhub.user.dto.UserSkillResponseDto;
import com.fixhub.user.entity.Skill;
import com.fixhub.user.entity.User;
import com.fixhub.user.entity.UserSkill;
import org.springframework.stereotype.Component;

@Component
public class SkillMapper {

    public SkillResponseDto toDto(Skill skill) {
        if (skill == null) {
            return null;
        }
        SkillResponseDto dto = new SkillResponseDto();
        dto.setId(skill.getId());
        dto.setName(skill.getName());
        dto.setActive(skill.isActive());
        return dto;
    }

    public UserSkillResponseDto toUserSkillDto(UserSkill userSkill, Skill skill) {
        UserSkillResponseDto dto = new UserSkillResponseDto();
        dto.setId(userSkill.getId());
        dto.setSkillId(userSkill.getSkillId());
        dto.setSkillName(skill != null ? skill.getName() : null);
        dto.setStatus(userSkill.getStatus());
        dto.setRejectReason(userSkill.getRejectReason());
        dto.setReviewedOn(userSkill.getReviewedOn());
        dto.setCreatedAt(userSkill.getCreatedOn());
        return dto;
    }

    public SkillReviewResponseDto toReviewDto(UserSkill userSkill, Skill skill, User user) {
        SkillReviewResponseDto dto = new SkillReviewResponseDto();
        dto.setUserSkillId(userSkill.getId());
        dto.setUserId(userSkill.getUserId());
        dto.setUserFullName(user != null ? user.getFullName() : "Deleted user");
        dto.setUserEmail(user != null ? user.getEmail() : null);
        dto.setSkillId(userSkill.getSkillId());
        dto.setSkillName(skill != null ? skill.getName() : null);
        dto.setSkillActive(skill != null && skill.isActive());
        dto.setStatus(userSkill.getStatus());
        dto.setRejectReason(userSkill.getRejectReason());
        dto.setCreatedAt(userSkill.getCreatedOn());
        dto.setReviewedOn(userSkill.getReviewedOn());
        return dto;
    }
}