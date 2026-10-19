package com.fixhub.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SkillRequestDto {

    @NotBlank(message = "Skill name is required")
    @Size(max = 100, message = "Skill name cannot exceed 100 characters")
    private String name;

    private Boolean active;
}