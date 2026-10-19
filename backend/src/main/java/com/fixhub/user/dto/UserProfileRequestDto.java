package com.fixhub.user.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * Admin fills this. Null field = leave unchanged.
 * skillIds = skills to add as APPROVED. Existing ones are kept. Remove uses DELETE endpoint.
 */
@Getter
@Setter
public class UserProfileRequestDto {

    private Long departmentId;

    @Size(max = 100, message = "Designation cannot exceed 100 characters")
    private String designation;

    @Size(max = 100, message = "Work location cannot exceed 100 characters")
    private String workLocation;

    private List<Long> skillIds;
}