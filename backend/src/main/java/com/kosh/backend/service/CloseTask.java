package com.kosh.backend.service;

import java.time.LocalDate;

import com.kosh.backend.model.Network;

/** A close-time operation. Implementations must be idempotent for their own scope. */
public interface CloseTask {
    boolean supports(CloseService.CloseType type);
    void execute(Network network, LocalDate processingDate);
}
