package com.kosh.backend.service;

import java.security.SecureRandom;

/**
 * Single source of one-time verification codes.
 *
 * <p>{@code java.util.Random} is a linear congruential generator seeded from the clock:
 * observing a couple of codes is enough to predict the rest. Anything guarding a login or a
 * password reset has to come from a cryptographically strong source instead.
 */
public final class OneTimeCode {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int BOUND = 1_000_000; // full 000000-999999 range

    private OneTimeCode() {
    }

    public static String generate() {
        return String.format("%06d", RANDOM.nextInt(BOUND));
    }
}
