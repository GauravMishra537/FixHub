package com.fixhub.common.storage;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** Reads app.storage.* from application.yml. Keys come from application-local.yml. */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {

    // backend talks to the storage server here
    private String endpoint = "http://127.0.0.1:9000";
    // links given to the browser use this host
    private String publicEndpoint = "http://localhost:9000";
    private String bucket = "fixhub-attachments";
    private String region = "us-east-1";
    private String accessKey = "";
    private String secretKey = "";

    private long partSizeBytes = 5L * 1024 * 1024;
    private long maxSizeBytes = 25L * 1024 * 1024;
    private int maxFilesPerTicket = 10;
    private int maxOpenUploadsPerUser = 3;
    private int partUrlMinutes = 15;
    private int downloadUrlMinutes = 2;
    private int staleUploadHours = 24;
}