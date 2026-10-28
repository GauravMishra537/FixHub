package com.fixhub.ticket.service;

import java.util.Locale;
import java.util.Map;

/** Allowed file types, and a check of the first bytes so a renamed file is caught. */
public final class AttachmentTypes {

    /** How many bytes of the file start we read for the check. */
    public static final int HEAD_BYTES = 512;

    public static final String ALLOWED_TEXT = "png, jpg, pdf, txt, docx, xlsx";

    private static final Map<String, String> TYPES = Map.of(
            "png", "image/png",
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "pdf", "application/pdf",
            "txt", "text/plain",
            "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private AttachmentTypes() {
    }

    /** Lower case text after the last dot. Empty when there is none. */
    public static String extensionOf(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    /** Content type for an allowed extension, null when the type is not allowed. */
    public static String contentTypeOf(String extension) {
        return TYPES.get(extension);
    }

    /** Do the first bytes fit the type the name claims? */
    public static boolean matches(String extension, byte[] head) {
        return switch (extension) {
            case "png" -> startsWith(head, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);
            case "jpg", "jpeg" -> startsWith(head, 0xFF, 0xD8, 0xFF);
            case "pdf" -> startsWith(head, 0x25, 0x50, 0x44, 0x46);
            // docx and xlsx are zip files
            case "docx", "xlsx" -> startsWith(head, 0x50, 0x4B, 0x03, 0x04);
            // plain text has no zero byte
            case "txt" -> noZeroByte(head);
            default -> false;
        };
    }

        /** Types the browser may show inside the app. The rest are download only. */
    public static boolean canPreview(String contentType) {
        return "image/png".equals(contentType)
                || "image/jpeg".equals(contentType)
                || "application/pdf".equals(contentType)
                || "text/plain".equals(contentType);
    }
    
    private static boolean startsWith(byte[] head, int... signature) {
        if (head == null || head.length < signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if ((head[i] & 0xFF) != signature[i]) {
                return false;
            }
        }
        return true;
    }

    private static boolean noZeroByte(byte[] head) {
        if (head == null) {
            return false;
        }
        for (byte b : head) {
            if (b == 0) {
                return false;
            }
        }
        return true;
    }
}