package com.fixhub.user.dto;

import com.fixhub.user.entity.SkillStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class SkillReviewResponseDto {

    private Long userSkillId;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private Long skillId;
    private String skillName;
    private boolean skillActive;
    private SkillStatus status;
    private String rejectReason;
    private Instant createdAt;
    private Instant reviewedOn;
}