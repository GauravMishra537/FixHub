package com.fixhub.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommentRequestDto {

    @NotBlank(message = "Comment cannot be empty")
    @Size(max = 2000, message = "Comment cannot exceed 2000 characters")
    private String body;
}