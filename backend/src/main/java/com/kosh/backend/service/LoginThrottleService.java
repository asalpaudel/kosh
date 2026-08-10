package com.kosh.backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.stereotype.Service;

/**
 * Failure counter for the credential endpoints.
 *
 * <p>Every password and one-time code in Kosh is short enough to guess if guessing is free:
 * a six-digit code is a million tries, a human-chosen password far fewer. Each key gets
 * {@value #MAX_FAILURES} failures before it is locked out for {@link #BLOCK_DURATION}, which
 * turns those numbers into years instead of minutes.
 *
 * <p>ponytail: in-memory and per instance, so a multi-instance deployment multiplies the
 * allowance by the instance count. Move the counter to Redis if Kosh is ever run behind more
 * than one backend.
 */
@Service
public class LoginThrottleService {

    public static final int MAX_FAILURES = 5;
    public static final Duration BLOCK_DURATION = Duration.ofMinutes(15);

    /** Above this many tracked keys, expired entries are swept so a spray cannot grow the map. */
    private static final int SWEEP_THRESHOLD = 10_000;

    private final Map<String, Failures> failures = new ConcurrentHashMap<>();

    /** True when the key has spent its attempts and is still inside the lockout window. */
    public boolean isBlocked(String key) {
        Failures record = failures.get(normalize(key));
        if (record == null) {
            return false;
        }
        if (record.expired()) {
            failures.remove(normalize(key), record);
            return false;
        }
        return record.count.get() >= MAX_FAILURES;
    }

    /** Records one bad password or bad code. The lockout window restarts on every failure. */
    public void recordFailure(String key) {
        if (failures.size() > SWEEP_THRESHOLD) {
            failures.values().removeIf(Failures::expired);
        }
        failures.compute(normalize(key), (ignored, record) -> {
            if (record == null || record.expired()) {
                return new Failures();
            }
            record.count.incrementAndGet();
            record.lastFailure = Instant.now();
            return record;
        });
    }

    /** Clears the counter after a successful authentication. */
    public void clear(String key) {
        failures.remove(normalize(key));
    }

    public Duration blockDuration() {
        return BLOCK_DURATION;
    }

    private static String normalize(String key) {
        return key == null ? "" : key.trim().toLowerCase();
    }

    private static final class Failures {
        private final AtomicInteger count = new AtomicInteger(1);
        private volatile Instant lastFailure = Instant.now();

        boolean expired() {
            return lastFailure.plus(BLOCK_DURATION).isBefore(Instant.now());
        }
    }
}
