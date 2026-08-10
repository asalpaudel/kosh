package com.kosh.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class LoginThrottleServiceTest {

    @Test
    void lockoutStartsAfterTheAllowedNumberOfFailures() {
        LoginThrottleService throttle = new LoginThrottleService();

        for (int i = 0; i < LoginThrottleService.MAX_FAILURES - 1; i++) {
            throttle.recordFailure("login:member@example.test");
            assertThat(throttle.isBlocked("login:member@example.test")).isFalse();
        }

        throttle.recordFailure("login:member@example.test");
        assertThat(throttle.isBlocked("login:member@example.test")).isTrue();
    }

    @Test
    void aSuccessfulAttemptClearsTheCounter() {
        LoginThrottleService throttle = new LoginThrottleService();

        for (int i = 0; i < LoginThrottleService.MAX_FAILURES; i++) {
            throttle.recordFailure("login:member@example.test");
        }
        throttle.clear("login:member@example.test");

        assertThat(throttle.isBlocked("login:member@example.test")).isFalse();
    }

    @Test
    void oneAccountLockoutDoesNotBlockAnother() {
        LoginThrottleService throttle = new LoginThrottleService();

        for (int i = 0; i < LoginThrottleService.MAX_FAILURES; i++) {
            throttle.recordFailure("login:victim@example.test");
        }

        assertThat(throttle.isBlocked("login:victim@example.test")).isTrue();
        assertThat(throttle.isBlocked("login:someone-else@example.test")).isFalse();
    }
}
