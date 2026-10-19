package com.fixhub.user.dto;

import com.fixhub.user.entity.SkillStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class UserSkillResponseDto {

    private Long id;
    private Long skillId;
    private String skillName;
    private SkillStatus status;
    private String rejectReason;
    private Instant reviewedOn;
    private Instant createdAt;
}