package com.fixhub.ticket.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Every hour: uploads that never finished are aborted, so the storage keeps no dead parts. */
@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class AttachmentCleanupJob {

    private final AttachmentService attachmentService;

    @Scheduled(initialDelayString = "PT2M", fixedDelayString = "PT1H")
    public void run() {
        try {
            int cleaned = attachmentService.cleanStaleUploads();
            if (cleaned > 0) {
                log.info("Cleaned {} unfinished uploads", cleaned);
            }
        } catch (Exception e) {
            log.warn("Upload cleanup failed: {}", e.getMessage());
        }
    }
}