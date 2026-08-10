package com.kosh.backend.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Base64;

import org.springframework.web.multipart.MultipartFile;

/** Central allowlist and magic-byte validation for every persisted upload. */
public final class FileSecurity {

    public static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;
    public static final long MAX_DOCUMENT_BYTES = 8L * 1024 * 1024;

    public enum Kind { IMAGE, DOCUMENT }

    public record StoredFile(byte[] data, String filename, String contentType) {
        public StoredFile {
            data = data.clone();
        }
        @Override public byte[] data() { return data.clone(); }
    }

    private FileSecurity() {
    }

    public static StoredFile validate(MultipartFile upload, Kind kind) throws IOException {
        if (upload == null || upload.isEmpty()) return null;
        long limit = limit(kind);
        if (upload.getSize() <= 0 || upload.getSize() > limit) {
            throw new IllegalArgumentException("Upload exceeds the allowed size");
        }
        return validate(upload.getBytes(), upload.getOriginalFilename(), kind);
    }

    public static StoredFile validate(byte[] data, String originalFilename, Kind kind) {
        if (data == null || data.length == 0 || data.length > limit(kind)) {
            throw new IllegalArgumentException("Upload is empty or exceeds the allowed size");
        }

        DetectedType detected = detect(data);
        if (detected == null || kind == Kind.IMAGE && !detected.image) {
            throw new IllegalArgumentException("Unsupported or spoofed upload type");
        }

        return new StoredFile(data, safeFilename(originalFilename, detected.extension), detected.contentType);
    }

    public static StoredFile validateBase64(String encoded, String originalFilename, Kind kind) {
        if (encoded == null || encoded.length() > ((limit(kind) + 2) / 3) * 4 + 4) {
            throw new IllegalArgumentException("Encoded upload exceeds the allowed size");
        }
        try {
            return validate(Base64.getDecoder().decode(encoded), originalFilename, kind);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Invalid or unsupported encoded upload", exception);
        }
    }

    public static String detectedContentType(byte[] data) {
        DetectedType detected = detect(data);
        return detected == null ? "application/octet-stream" : detected.contentType;
    }

    public static String safeStoredFilename(String storedName, byte[] data) {
        DetectedType detected = detect(data);
        return safeFilename(storedName, detected == null ? "bin" : detected.extension);
    }

    private static long limit(Kind kind) {
        return kind == Kind.IMAGE ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;
    }

    private static DetectedType detect(byte[] data) {
        if (startsWith(data, new byte[] {(byte) 0x89, 'P', 'N', 'G', 0x0d, 0x0a, 0x1a, 0x0a})) {
            return new DetectedType("image/png", "png", true);
        }
        if (data.length >= 3 && (data[0] & 0xff) == 0xff && (data[1] & 0xff) == 0xd8
                && (data[2] & 0xff) == 0xff) {
            return new DetectedType("image/jpeg", "jpg", true);
        }
        if (data.length >= 12 && ascii(data, 0, "RIFF") && ascii(data, 8, "WEBP")) {
            return new DetectedType("image/webp", "webp", true);
        }
        if (ascii(data, 0, "%PDF-")) {
            return new DetectedType("application/pdf", "pdf", false);
        }
        return null;
    }

    private static boolean startsWith(byte[] data, byte[] prefix) {
        if (data.length < prefix.length) return false;
        for (int index = 0; index < prefix.length; index++) {
            if (data[index] != prefix[index]) return false;
        }
        return true;
    }

    private static boolean ascii(byte[] data, int offset, String expected) {
        byte[] bytes = expected.getBytes(StandardCharsets.US_ASCII);
        if (data.length < offset + bytes.length) return false;
        for (int index = 0; index < bytes.length; index++) {
            if (data[offset + index] != bytes[index]) return false;
        }
        return true;
    }

    private static String safeFilename(String original, String extension) {
        String value = original == null ? "upload" : original.replace('\\', '/');
        value = value.substring(value.lastIndexOf('/') + 1);
        int firstDot = value.indexOf('.');
        if (firstDot >= 0) value = value.substring(0, firstDot);
        value = value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]", "-")
                .replaceAll("-+", "-").replaceAll("^-|-$", "");
        if (value.isBlank()) value = "upload";
        if (value.length() > 64) value = value.substring(0, 64);
        return value + "." + extension;
    }

    private record DetectedType(String contentType, String extension, boolean image) {
    }
}
