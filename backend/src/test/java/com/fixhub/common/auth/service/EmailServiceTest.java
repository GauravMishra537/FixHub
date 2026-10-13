package com.fixhub.common.auth.service;

import com.fixhub.common.auth.service.impl.EmailServiceImpl;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    private EmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailServiceImpl(
                mailSender,
                "http://localhost:5173",
                "noreply@fixhub.local"
        );
    }

    @Test
    void sendVerificationEmail_success() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        assertDoesNotThrow(() ->
                emailService.sendVerificationEmail("user@example.com", "Alex Smith", "sample-token")
        );

        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    void sendVerificationEmail_handlesExceptionGracefully() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new MailSendException("SMTP connection timed out")).when(mailSender).send(mimeMessage);

        assertDoesNotThrow(() ->
                emailService.sendVerificationEmail("user@example.com", "Alex Smith", "sample-token")
        );

        verify(mailSender, times(1)).send(mimeMessage);
    }
}
