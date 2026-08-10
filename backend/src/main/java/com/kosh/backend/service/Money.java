package com.kosh.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Rules for every amount Kosh stores or reports.
 *
 * <p>Two decimals, half-up, matching what a member sees on a passbook and what the
 * {@code numeric(18,2)} columns hold. Amounts arriving from JSON go through {@link #of}
 * so a request body can never smuggle in a binary float.
 */
public final class Money {

    public static final int SCALE = 2;
    public static final RoundingMode ROUNDING = RoundingMode.HALF_UP;
    public static final BigDecimal ZERO = BigDecimal.ZERO.setScale(SCALE);

    private Money() {
    }

    /** Normalises a stored or computed amount to the money scale. */
    public static BigDecimal round(BigDecimal value) {
        return value == null ? null : value.setScale(SCALE, ROUNDING);
    }

    public static BigDecimal orZero(BigDecimal value) {
        return value == null ? ZERO : value;
    }

    /**
     * Parses an amount out of a request payload. Numbers are read through their string
     * form so a JSON double never becomes the source of truth for a balance.
     */
    public static BigDecimal of(Object raw) {
        if (raw == null) return null;
        if (raw instanceof BigDecimal decimal) return round(decimal);
        return round(new BigDecimal(raw.toString().trim()));
    }
}
