package com.kosh.backend.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/** Generates bearer secrets and one-way verifiers without storing the bearer value. */
public final class SecureToken {

    private static final SecureRandom RANDOM = new SecureRandom();

    private SecureToken() {
    }

    public static String generate() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String verifier(String token) {
        if (token == null) return null;
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is unavailable", impossible);
        }
    }

    public static boolean matches(String token, String expectedVerifier) {
        if (token == null || expectedVerifier == null) return false;
        return MessageDigest.isEqual(
                verifier(token).getBytes(StandardCharsets.US_ASCII),
                expectedVerifier.getBytes(StandardCharsets.US_ASCII));
    }
}
