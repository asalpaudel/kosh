package com.kosh.backend.calendar;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import org.springframework.stereotype.Service;

/**
 * Exact BS/AD conversion backed by the published month-length table for 1975–2099 BS.
 * The calendar cannot be derived by adding a fixed year offset because BS month lengths
 * change by year.
 */
@Service
public class BikramSambatCalendar {

    public static final int MIN_YEAR = 1975;
    public static final int MAX_YEAR = 2099;
    public static final LocalDate MIN_AD = LocalDate.of(1918, 4, 13);
    public static final LocalDate MAX_AD = LocalDate.of(2043, 4, 13);

    private static final int[][] MONTH_PATTERNS = {
            {31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30},
            {31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31},
            {30, 32, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31},
            {31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30},
            {31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31},
            {31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30},
            {31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30},
            {31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30},
            {31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30},
            {31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31},
            {31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30},
            {30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31},
            {30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31}
    };

    /** One base-36 pattern index for every year from 1975 through 2099. */
    private static final String YEAR_PATTERNS =
            "01230143015361738973893a1b301b3014301530153697389731b3a1b301230153015361738973893a1b301c3014301536173897389331b301b3014301530";

    public LocalDate toAd(BsDate bs) {
        validate(bs);
        long offset = 0;
        for (int year = MIN_YEAR; year < bs.year(); year++) offset += daysInYear(year);
        for (int month = 1; month < bs.month(); month++) offset += daysInMonth(bs.year(), month);
        return MIN_AD.plusDays(offset + bs.day() - 1L);
    }

    public BsDate toBs(LocalDate ad) {
        if (ad == null || ad.isBefore(MIN_AD) || ad.isAfter(MAX_AD)) {
            throw new IllegalArgumentException("AD date must be between " + MIN_AD + " and " + MAX_AD);
        }
        long remaining = ChronoUnit.DAYS.between(MIN_AD, ad);
        int year = MIN_YEAR;
        while (remaining >= daysInYear(year)) remaining -= daysInYear(year++);
        int month = 1;
        while (remaining >= daysInMonth(year, month)) remaining -= daysInMonth(year, month++);
        return new BsDate(year, month, Math.toIntExact(remaining) + 1);
    }

    public int daysInMonth(int year, int month) {
        if (year < MIN_YEAR || year > MAX_YEAR || month < 1 || month > 12) {
            throw new IllegalArgumentException("Unsupported BS year or month");
        }
        int pattern = Character.digit(YEAR_PATTERNS.charAt(year - MIN_YEAR), 36);
        return MONTH_PATTERNS[pattern][month - 1];
    }

    public FiscalYear fiscalYearFor(LocalDate ad) {
        BsDate bs = toBs(ad);
        int startYear = bs.month() >= 4 ? bs.year() : bs.year() - 1;
        if (startYear < MIN_YEAR || startYear + 1 > MAX_YEAR) {
            throw new IllegalArgumentException("Fiscal year is outside the supported BS range");
        }
        LocalDate start = toAd(new BsDate(startYear, 4, 1));
        LocalDate end = toAd(new BsDate(startYear + 1, 4, 1)).minusDays(1);
        return new FiscalYear(startYear + "/" + String.format("%02d", (startYear + 1) % 100),
                startYear, start, end);
    }

    private int daysInYear(int year) {
        int total = 0;
        for (int month = 1; month <= 12; month++) total += daysInMonth(year, month);
        return total;
    }

    private void validate(BsDate bs) {
        if (bs == null || bs.year() < MIN_YEAR || bs.year() > MAX_YEAR
                || bs.month() < 1 || bs.month() > 12
                || bs.day() < 1 || bs.day() > daysInMonth(bs.year(), bs.month())) {
            throw new IllegalArgumentException("Invalid or unsupported BS date");
        }
    }

    public record FiscalYear(String label, int startBsYear, LocalDate startAd, LocalDate endAd) {
    }
}
