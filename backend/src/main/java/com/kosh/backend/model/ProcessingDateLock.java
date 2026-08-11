package com.kosh.backend.model;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "processing_date_locks")
public class ProcessingDateLock {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "network_id") private Network network;
    private String processType;
    private LocalDate processingDate;
    private String scopeKey;
    private Instant startedAt;
    private Instant completedAt;
    private String completedBy;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Network getNetwork() { return network; }
    public void setNetwork(Network network) { this.network = network; }
    public String getProcessType() { return processType; }
    public void setProcessType(String processType) { this.processType = processType; }
    public LocalDate getProcessingDate() { return processingDate; }
    public void setProcessingDate(LocalDate processingDate) { this.processingDate = processingDate; }
    public String getScopeKey() { return scopeKey; }
    public void setScopeKey(String scopeKey) { this.scopeKey = scopeKey; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    public String getCompletedBy() { return completedBy; }
    public void setCompletedBy(String completedBy) { this.completedBy = completedBy; }
}
