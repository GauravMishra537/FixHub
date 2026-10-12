package com.fixhub.common.auth.service.impl;

import com.fixhub.common.auth.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final String frontendUrl;

    public EmailServiceImpl(@Value("${app.frontend.url:http://localhost:5173}") String frontendUrl) {
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void sendVerificationEmail(String recipientEmail, String recipientName, String token) {
        String verificationUrl = frontendUrl + "/verify-email?token=" + token;

        logger.info("================================================================================");
        logger.info("[FixHub Email Service] Verification link generated");
        logger.info("Recipient: {} <{}>", recipientName, recipientEmail);
        logger.info("Verification URL: {}", verificationUrl);
        logger.info("Token: {}", token);
        logger.info("================================================================================");
    }
}
