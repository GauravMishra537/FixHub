package com.fixhub.common.storage;

import java.util.List;

/**
 * Where file bytes live. The browser sends parts straight to the storage with signed links,
 * so the backend never carries the file.
 */
public interface ObjectStore {

    /** Starts a multipart upload for this key. Returns the storage's upload id. */
    String startMultipart(String key, String contentType);

    /** A signed link the browser uses to PUT one part. Part numbers start at 1. */
    String presignPart(String key, String uploadId, int partNumber);

    /** The parts the storage already holds. This is how an upload resumes. */
    List<StoredPart> listParts(String key, String uploadId);

    /** Joins the parts into one file. */
    void complete(String key, String uploadId, List<StoredPart> parts);

    /** Throws the parts away. Fine when the upload is already gone. */
    void abort(String key, String uploadId);

    /** Real size of a finished object. */
    long sizeOf(String key);

    /** First bytes of a finished object, to check the file type. */
    byte[] readFirstBytes(String key, int count);

    /** A short signed link. inline true shows the file in the browser, false downloads it. */
    String presignDownload(String key, String fileName, String contentType, boolean inline);

    void delete(String key);
}