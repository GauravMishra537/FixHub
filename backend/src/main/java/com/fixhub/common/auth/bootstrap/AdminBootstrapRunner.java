package com.fixhub.common.auth.bootstrap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrapRunner implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final AdminBootstrapService adminBootstrapService;

    @Value("${app.bootstrap-admin.enabled:false}")
    private boolean propertyEnabled;

    public AdminBootstrapRunner(AdminBootstrapService adminBootstrapService) {
        this.adminBootstrapService = adminBootstrapService;
    }

    @Override
    public void run(ApplicationArguments args) {
        boolean optInArg = args.containsOption("app.bootstrap-admin")
                && "true".equalsIgnoreCase(String.join("", args.getOptionValues("app.bootstrap-admin")));

        boolean plainFlagArg = args.containsOption("bootstrap-admin");

        if (!propertyEnabled && !optInArg && !plainFlagArg) {
            return;
        }

        logger.info("[Admin Bootstrap] Opt-in detected. Running initial administrator provisioning check...");
        boolean success = adminBootstrapService.bootstrapAdmin();
        if (success) {
            logger.info("[Admin Bootstrap] Provisioning process finished successfully.");
        } else {
            logger.info("[Admin Bootstrap] Provisioning did not create an administrator (see logs above).");
        }
    }
}
