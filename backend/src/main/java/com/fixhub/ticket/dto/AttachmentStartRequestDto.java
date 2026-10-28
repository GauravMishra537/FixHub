package com.fixhub.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/** What the browser tells before it sends any byte. Type is decided by the server from the file name. */
@Getter
@Setter
public class AttachmentStartRequestDto {

    @NotBlank
    @Size(max = 255)
    private String fileName;

    @NotNull
    private Long sizeBytes;
}