package com.fixhub.user.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DepartmentResponseDto {

    private Long id;
    private String name;
    private boolean active;
}