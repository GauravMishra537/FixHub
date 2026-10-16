package com.fixhub.common.auth.service;

public interface PasswordRecoveryService {

    void forgotPassword(String email);

    void resetPassword(String token, String newPassword);

    void setPassword(Long userId, String newPassword);
}