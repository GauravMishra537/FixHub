package com.fixhub.common.storage;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;
import java.time.Duration;

@Configuration
public class StorageConfig {

    // missing keys must not stop the app. calls fail later with "storage is not available"
    private StaticCredentialsProvider credentials(StorageProperties p) {
        String key = p.getAccessKey() == null || p.getAccessKey().isBlank() ? "unset" : p.getAccessKey();
        String secret = p.getSecretKey() == null || p.getSecretKey().isBlank() ? "unset" : p.getSecretKey();
        return StaticCredentialsProvider.create(AwsBasicCredentials.create(key, secret));
    }

    /** Backend to storage calls: start, list parts, complete, abort, check, delete. */
    @Bean
    public S3Client s3Client(StorageProperties p) {
        return S3Client.builder()
                .endpointOverride(URI.create(p.getEndpoint()))
                .region(Region.of(p.getRegion()))
                .credentialsProvider(credentials(p))
                .forcePathStyle(true)
                .overrideConfiguration(c -> c.apiCallTimeout(Duration.ofSeconds(30)))
                .build();
    }

    /** Makes the signed links for the browser. It signs for the public host, so the storage accepts them. */
    @Bean
    public S3Presigner s3Presigner(StorageProperties p) {
        return S3Presigner.builder()
                .endpointOverride(URI.create(p.getPublicEndpoint()))
                .region(Region.of(p.getRegion()))
                .credentialsProvider(credentials(p))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();
    }
}