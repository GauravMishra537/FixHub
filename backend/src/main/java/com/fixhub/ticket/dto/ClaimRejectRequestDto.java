package com.fixhub.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClaimRejectRequestDto {

    @NotBlank(message = "Reason is required")
    @Size(max = 255, message = "Reason can have at most 255 characters")
    private String reason;
}