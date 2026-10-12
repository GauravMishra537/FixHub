package com.fixhub.common.auth.service;

public interface EmailService {

    void sendVerificationEmail(String recipientEmail, String recipientName, String token);
}
