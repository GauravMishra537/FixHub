package com.fixhub.common.auth.dto;

import com.fixhub.user.dto.UserResponseDto;

public class LoginResponseDto {

    private String accessToken;
    private String tokenType = "Bearer";
    private UserResponseDto user;

    public LoginResponseDto() {
    }

    public LoginResponseDto(String accessToken, UserResponseDto user) {
        this.accessToken = accessToken;
        this.tokenType = "Bearer";
        this.user = user;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public UserResponseDto getUser() {
        return user;
    }

    public void setUser(UserResponseDto user) {
        this.user = user;
    }
}
