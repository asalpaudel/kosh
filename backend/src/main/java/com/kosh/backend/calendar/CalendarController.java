package com.kosh.backend.calendar;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    private static final ZoneId NEPAL_TIME = ZoneId.of("Asia/Kathmandu");

    private final BikramSambatCalendar calendar;

    public CalendarController(BikramSambatCalendar calendar) {
        this.calendar = calendar;
    }

    @GetMapping("/convert")
    public Map<String, Object> convert(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ad) {
        BsDate bs = calendar.toBs(ad);
        return Map.of("ad", ad, "bs", bs.toString());
    }

    @GetMapping("/fiscal-year")
    public Map<String, Object> fiscalYear(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate effective = date != null ? date : LocalDate.now(NEPAL_TIME);
        var fiscalYear = calendar.fiscalYearFor(effective);
        return Map.of(
                "label", fiscalYear.label(),
                "startAd", fiscalYear.startAd(),
                "startBs", calendar.toBs(fiscalYear.startAd()).toString(),
                "endAd", fiscalYear.endAd(),
                "endBs", calendar.toBs(fiscalYear.endAd()).toString());
    }
}
