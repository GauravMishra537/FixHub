package com.fixhub.common.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleExchangeRequestDto(@NotBlank String code) {
}