package com.fixhub.common.auth.bootstrap.impl;

import com.fixhub.common.auth.bootstrap.AdminBootstrapService;
import com.fixhub.user.entity.AccountStatus;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import com.fixhub.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Pattern;

@Service
public class AdminBootstrapServiceImpl implements AdminBootstrapService {

    private static final Logger logger = LoggerFactory.getLogger(AdminBootstrapServiceImpl.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap-admin.email:}")
    private String configuredEmail;

    @Value("${app.bootstrap-admin.password:}")
    private String configuredPassword;

    @Value("${app.bootstrap-admin.name:FixHub Administrator}")
    private String configuredName;

    public AdminBootstrapServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public boolean bootstrapAdmin() {
        String email = (configuredEmail != null && !configuredEmail.isBlank())
                ? configuredEmail
                : System.getenv("ADMIN_EMAIL");

        String password = (configuredPassword != null && !configuredPassword.isBlank())
                ? configuredPassword
                : System.getenv("ADMIN_PASSWORD");

        String name = (configuredName != null && !configuredName.isBlank())
                ? configuredName
                : System.getenv("ADMIN_NAME");

        return bootstrapAdmin(email, password, name);
    }

    @Override
    @Transactional
    public boolean bootstrapAdmin(String email, String password, String fullName) {
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            logger.error("[Admin Bootstrap] Failed: Both administrator email and password must be provided.");
            return false;
        }

        String normalizedEmail = email.trim().toLowerCase();

        if (!EMAIL_PATTERN.matcher(normalizedEmail).matches()) {
            logger.error("[Admin Bootstrap] Failed: Invalid administrator email format: {}", normalizedEmail);
            return false;
        }

        if (password.length() < 8) {
            logger.error("[Admin Bootstrap] Failed: Administrator password must be at least 8 characters long.");
            return false;
        }

        if (userRepository.existsByRole(Role.ADMIN)) {
            logger.warn("[Admin Bootstrap] Refused: An administrator account already exists. Only one initial administrator can be provisioned.");
            return false;
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            logger.warn("[Admin Bootstrap] Refused: User with email '{}' already exists. Overwrite or silent promotion is prohibited.", normalizedEmail);
            return false;
        }

        User admin = new User();
        admin.setEmail(normalizedEmail);
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setFullName(fullName != null && !fullName.isBlank() ? fullName.trim() : "FixHub Administrator");
        admin.setRole(Role.ADMIN);
        admin.setStatus(AccountStatus.ACTIVE);
        admin.setEmailVerified(true);
        admin.setDepartment("System Administration");
        admin.setDesignation("Administrator");

        userRepository.save(admin);
        logger.info("[Admin Bootstrap] Initial administrator account provisioned successfully for: {}", normalizedEmail);
        return true;
    }
}
