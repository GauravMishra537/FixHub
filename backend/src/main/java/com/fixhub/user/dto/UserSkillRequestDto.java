package com.fixhub.user.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/** Send skillId to pick from list, or name to propose a new one. */
@Getter
@Setter
public class UserSkillRequestDto {

    private Long skillId;

    @Size(max = 100, message = "Skill name cannot exceed 100 characters")
    private String name;
}