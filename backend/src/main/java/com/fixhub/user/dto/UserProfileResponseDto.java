package com.fixhub.user.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UserProfileResponseDto {

    private Long userId;
    private String fullName;
    private String email;
    private Long departmentId;
    private String departmentName;
    private String designation;
    private String workLocation;
    private String phoneNumber;
    private List<UserSkillResponseDto> skills;
}