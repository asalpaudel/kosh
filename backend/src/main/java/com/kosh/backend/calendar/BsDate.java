package com.kosh.backend.calendar;

/** A validated Bikram Sambat calendar date. Months are 1-based. */
public record BsDate(int year, int month, int day) {

    @Override
    public String toString() {
        return "%04d-%02d-%02d".formatted(year, month, day);
    }
}
