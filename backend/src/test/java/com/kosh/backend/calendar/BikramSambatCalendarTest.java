package com.kosh.backend.calendar;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;

class BikramSambatCalendarTest {

    private final BikramSambatCalendar calendar = new BikramSambatCalendar();

    @Test
    void convertsKnownDatesInBothDirections() {
        assertThat(calendar.toAd(new BsDate(2080, 1, 15))).isEqualTo(LocalDate.of(2023, 4, 28));
        assertThat(calendar.toBs(LocalDate.of(2023, 4, 28))).isEqualTo(new BsDate(2080, 1, 15));
        assertThat(calendar.toBs(LocalDate.of(2026, 8, 11))).isEqualTo(new BsDate(2083, 4, 26));
    }

    @Test
    void usesYearSpecificMonthLengths() {
        assertThat(calendar.daysInMonth(2080, 2)).isEqualTo(32);
        assertThat(calendar.daysInMonth(2082, 2)).isEqualTo(31);
        assertThatThrownBy(() -> calendar.toAd(new BsDate(2082, 2, 32)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void roundTripsDatesAcrossTheSupportedRange() {
        for (LocalDate date = BikramSambatCalendar.MIN_AD;
             !date.isAfter(BikramSambatCalendar.MAX_AD);
             date = date.plusDays(97)) {
            assertThat(calendar.toAd(calendar.toBs(date))).isEqualTo(date);
        }
    }

    @Test
    void fiscalYearRunsFromShrawanOneThroughAsarEnd() {
        var fiscalYear = calendar.fiscalYearFor(LocalDate.of(2026, 8, 11));
        assertThat(fiscalYear.label()).isEqualTo("2083/84");
        assertThat(calendar.toBs(fiscalYear.startAd())).isEqualTo(new BsDate(2083, 4, 1));
        assertThat(calendar.toBs(fiscalYear.endAd())).isEqualTo(new BsDate(2084, 3, 31));
        assertThat(fiscalYear.endAd().plusDays(1)).isEqualTo(
                calendar.toAd(new BsDate(2084, 4, 1)));
    }

    @Test
    void rejectsDatesOutsideTheLookupTable() {
        assertThatThrownBy(() -> calendar.toBs(LocalDate.of(1918, 4, 12)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> calendar.toAd(new BsDate(2100, 1, 1)))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
