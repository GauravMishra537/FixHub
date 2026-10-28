package com.fixhub.common.storage.impl;

import com.fixhub.common.storage.ObjectStore;
import com.fixhub.common.storage.StorageProperties;
import com.fixhub.common.storage.StoredPart;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.AbortMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CompleteMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CompletedMultipartUpload;
import software.amazon.awssdk.services.s3.model.CompletedPart;
import software.amazon.awssdk.services.s3.model.CreateMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.ListPartsRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.UploadPartRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.UploadPartPresignRequest;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.function.Supplier;

/** Object storage over the S3 API. Works with Silo, MinIO and other S3 servers. */
@Slf4j
@Component
@RequiredArgsConstructor
public class MinioObjectStore implements ObjectStore {

    private final S3Client s3;
    private final S3Presigner presigner;
    private final StorageProperties props;

    // the app must start even when the storage is off. only say it in the log
    @EventListener(ApplicationReadyEvent.class)
    public void checkOnStart() {
        try {
            s3.headBucket(HeadBucketRequest.builder().bucket(props.getBucket()).build());
            log.info("Object storage ready. Bucket {}", props.getBucket());
        } catch (Exception e) {
            log.warn("Object storage is not reachable ({}). Attachments stay off until it runs.", e.getMessage());
        }
    }

    @Override
    public String startMultipart(String key, String contentType) {
        return call("start upload", () -> s3.createMultipartUpload(CreateMultipartUploadRequest.builder()
                .bucket(props.getBucket())
                .key(key)
                .contentType(contentType)
                .build()).uploadId());
    }

    @Override
    public String presignPart(String key, String uploadId, int partNumber) {
        return call("sign part", () -> {
            UploadPartRequest part = UploadPartRequest.builder()
                    .bucket(props.getBucket())
                    .key(key)
                    .uploadId(uploadId)
                    .partNumber(partNumber)
                    .build();
            return presigner.presignUploadPart(UploadPartPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(props.getPartUrlMinutes()))
                    .uploadPartRequest(part)
                    .build()).url().toString();
        });
    }

    @Override
    public List<StoredPart> listParts(String key, String uploadId) {
        return call("list parts", () -> s3.listParts(ListPartsRequest.builder()
                        .bucket(props.getBucket())
                        .key(key)
                        .uploadId(uploadId)
                        .maxParts(1000)
                        .build())
                .parts().stream()
                .map(p -> new StoredPart(p.partNumber(), p.size() == null ? 0L : p.size(), p.eTag()))
                .toList());
    }

    @Override
    public void complete(String key, String uploadId, List<StoredPart> parts) {
        List<CompletedPart> done = parts.stream()
                .sorted(Comparator.comparingInt(StoredPart::partNumber))
                .map(p -> CompletedPart.builder().partNumber(p.partNumber()).eTag(p.eTag()).build())
                .toList();
        call("complete upload", () -> s3.completeMultipartUpload(CompleteMultipartUploadRequest.builder()
                .bucket(props.getBucket())
                .key(key)
                .uploadId(uploadId)
                .multipartUpload(CompletedMultipartUpload.builder().parts(done).build())
                .build()));
    }

    @Override
    public void abort(String key, String uploadId) {
        try {
            call("abort upload", () -> s3.abortMultipartUpload(AbortMultipartUploadRequest.builder()
                    .bucket(props.getBucket())
                    .key(key)
                    .uploadId(uploadId)
                    .build()));
        } catch (ResponseStatusException e) {
            // already gone is fine
            if (e.getStatusCode() != HttpStatus.NOT_FOUND) {
                throw e;
            }
        }
    }

    @Override
    public long sizeOf(String key) {
        return call("read size", () -> s3.headObject(HeadObjectRequest.builder()
                .bucket(props.getBucket())
                .key(key)
                .build()).contentLength());
    }

    @Override
    public byte[] readFirstBytes(String key, int count) {
        return call("read file start", () -> s3.getObjectAsBytes(GetObjectRequest.builder()
                .bucket(props.getBucket())
                .key(key)
                .range("bytes=0-" + (count - 1))
                .build()).asByteArray());
    }

        @Override
    public String presignDownload(String key, String fileName, String contentType, boolean inline) {
        return call("sign download", () -> {
            GetObjectRequest get = GetObjectRequest.builder()
                    .bucket(props.getBucket())
                    .key(key)
                    .responseContentDisposition(disposition(fileName, inline))
                    .responseContentType(contentType)
                    .build();
            return presigner.presignGetObject(GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(props.getDownloadUrlMinutes()))
                    .getObjectRequest(get)
                    .build()).url().toString();
        });
    }

    // inline: shown in the browser. attachment: always a download. plain ascii name for old browsers
    private static String disposition(String fileName, boolean inline) {
        String name = fileName == null || fileName.isBlank() ? "file" : fileName;
        String ascii = name.replaceAll("[^\\x20-\\x7E]", "_").replace("\"", "_").replace("\\", "_");
        String full = URLEncoder.encode(name, StandardCharsets.UTF_8).replace("+", "%20");
        return (inline ? "inline" : "attachment") + "; filename=\"" + ascii + "\"; filename*=UTF-8''" + full;
    }

    @Override
    public void delete(String key) {
        call("delete file", () -> s3.deleteObject(DeleteObjectRequest.builder()
                .bucket(props.getBucket())
                .key(key)
                .build()));
    }

    // attachment; plain ascii name for old browsers, full name for new ones
    private static String disposition(String fileName) {
        String name = fileName == null || fileName.isBlank() ? "file" : fileName;
        String ascii = name.replaceAll("[^\\x20-\\x7E]", "_").replace("\"", "_").replace("\\", "_");
        String full = URLEncoder.encode(name, StandardCharsets.UTF_8).replace("+", "%20");
        return "attachment; filename=\"" + ascii + "\"; filename*=UTF-8''" + full;
    }

    // one place that turns storage errors into clean answers
    private <T> T call(String what, Supplier<T> action) {
        try {
            return action.get();
        } catch (S3Exception e) {
            log.warn("Storage refused to {}: {} {}", what, e.statusCode(), e.getMessage());
            if (e.statusCode() == 404) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found in storage");
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Storage rejected the request");
        } catch (SdkException e) {
            log.warn("Storage is not reachable ({}): {}", what, e.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Storage is not available");
        }
    }
}