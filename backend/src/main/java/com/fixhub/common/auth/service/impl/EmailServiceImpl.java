package com.fixhub.common.auth.service.impl;

import com.fixhub.common.auth.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.io.UnsupportedEncodingException;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);

    private static final String STYLE = """
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
            .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 32px; }
            .brand { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 20px; }
            .brand span { color: #2563eb; }
            .greeting { font-size: 16px; margin-bottom: 16px; }
            .content { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
            .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; }
            .btn-box { text-align: center; margin: 28px 0; }
            .subtext { font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 20px; word-break: break-all; }
            .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 24px; }
            """;

    private final JavaMailSender mailSender;
    private final String frontendUrl;
    private final String fromEmail;

    public EmailServiceImpl(
            JavaMailSender mailSender,
            @Value("${app.frontend.url:http://localhost:5173}") String frontendUrl,
            @Value("${app.mail.from:noreply@fixhub.local}") String fromEmail
    ) {
        this.mailSender = mailSender;
        this.frontendUrl = frontendUrl;
        this.fromEmail = fromEmail;
    }

    @Override
    public void sendVerificationEmail(String recipientEmail, String recipientName, String token) {
        String url = frontendUrl + "/verify-email?token=" + token;

        String html = buildHtmlEmail(
                recipientName,
                "Thank you for registering on FixHub. Please verify your email address to confirm your account request. "
                        + "Once verified, your account will be reviewed by an administrator.",
                "Verify Email Address",
                url,
                "This link expires in 24 hours. If you did not sign up for FixHub, please disregard this email."
        );

        send(recipientEmail, "Verify your FixHub Account", html, "Verification", url);
    }

    @Override
    public void sendPasswordResetEmail(String recipientEmail, String recipientName, String token) {
        String url = frontendUrl + "/reset-password?token=" + token;

        String html = buildHtmlEmail(
                recipientName,
                "We received a request to reset your FixHub password. Click the button below to choose a new password.",
                "Reset Password",
                url,
                "This link expires in 30 minutes and works once. If you did not request a reset, you can ignore this email."
        );

        send(recipientEmail, "Reset your FixHub password", html, "Password reset", url);
    }

    private void send(String recipientEmail, String subject, String html, String label, String fallbackUrl) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            try {
                helper.setFrom(fromEmail, "FixHub");
            } catch (UnsupportedEncodingException e) {
                helper.setFrom(fromEmail);
            }

            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(html, true);

            mailSender.send(message);
            logger.info("{} email sent successfully to {}", label, recipientEmail);
        } catch (Exception e) {
            logger.error("Could not send {} email to {}: {}", label.toLowerCase(), recipientEmail, e.getMessage());
            logger.info("Fallback {} URL: {}", label.toLowerCase(), fallbackUrl);
        }
    }

    private String buildHtmlEmail(String name, String message, String buttonLabel, String url, String note) {
        String safeName = HtmlUtils.htmlEscape(name == null ? "" : name);

        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                %s
              </style>
            </head>
            <body>
              <div class="container">
                <div class="brand">Fix<span>Hub</span></div>
                <div class="greeting">Hello %s,</div>
                <div class="content">%s</div>
                <div class="btn-box">
                  <a href="%s" class="btn" target="_blank">%s</a>
                </div>
                <div class="subtext">
                  If the button above does not work, copy and paste this link into your browser:<br>
                  <a href="%s" style="color: #2563eb;">%s</a>
                  <br><br>
                  %s
                </div>
              </div>
              <div class="footer">
                &copy; 2026 FixHub. Universal Request &amp; Ticket Platform.
              </div>
            </body>
            </html>
            """.formatted(STYLE, safeName, message, url, buttonLabel, url, url, note);
    }
}