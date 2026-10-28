package com.fixhub.ticket.service;

import com.fixhub.common.storage.StorageProperties;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Every rule about an uploaded file in one place: name, type (extension and MIME), size, real content.
 * Before the upload starts we know only name and size. After it ends we can read the first bytes.
 */
@Component
public class AttachmentValidator {

    private static final int MAX_NAME = 255;

    private final StorageProperties props;

    public AttachmentValidator(StorageProperties props) {
        this.props = props;
    }

    /** The file as it passed the checks. name is clean, mimeType comes from our own list. */
    public record ValidFile(String name, String extension, String mimeType, long sizeBytes) {
    }

    /** Before the first byte: name, extension, MIME and size. Throws 400 with a clear message. */
    public ValidFile validateBeforeUpload(String rawName, Long sizeBytes) {
        String name = cleanName(rawName);
        if (name.isEmpty()) {
            throw bad("File name is missing");
        }
        if (name.length() > MAX_NAME) {
            throw bad("File name is too long");
        }

        // the type comes from the extension, looked up in our list. the browser's own claim is never used
        String extension = AttachmentTypes.extensionOf(name);
        String mimeType = AttachmentTypes.contentTypeOf(extension);
        if (mimeType == null) {
            throw bad("This file type is not allowed. Allowed: " + AttachmentTypes.ALLOWED_TEXT);
        }

        long size = sizeBytes == null ? 0 : sizeBytes;
        if (size < 1) {
            throw bad("The file is empty");
        }
        if (size > props.getMaxSizeBytes()) {
            throw bad("File is larger than " + (props.getMaxSizeBytes() / (1024 * 1024)) + " MB");
        }
        return new ValidFile(name, extension, mimeType, size);
    }

    /** After the upload: do the first bytes really belong to the type the name claims? */
    public boolean contentMatches(String fileName, byte[] head) {
        return AttachmentTypes.matches(AttachmentTypes.extensionOf(fileName), head);
    }

    // drop any folder part and control characters. what is left is shown, never used as a path
    private static String cleanName(String raw) {
        String name = raw == null ? "" : raw;
        int cut = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
        if (cut >= 0) {
            name = name.substring(cut + 1);
        }
        return name.replaceAll("\\p{Cntrl}", "").trim();
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}