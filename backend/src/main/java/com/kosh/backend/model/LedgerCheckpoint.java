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
@Table(name = "ledger_checkpoints")
public class LedgerCheckpoint {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "network_id") private Network network;
    private LocalDate checkpointDate;
    private Long sequenceNo;
    private String entryHash;
    private Instant createdAt;
    private Instant publishedAt;
    private Integer recipientCount = 0;

    public Long getId() { return id; }
    public void setId(Long value) { id = value; }
    public Network getNetwork() { return network; }
    public void setNetwork(Network value) { network = value; }
    public LocalDate getCheckpointDate() { return checkpointDate; }
    public void setCheckpointDate(LocalDate value) { checkpointDate = value; }
    public Long getSequenceNo() { return sequenceNo; }
    public void setSequenceNo(Long value) { sequenceNo = value; }
    public String getEntryHash() { return entryHash; }
    public void setEntryHash(String value) { entryHash = value; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant value) { createdAt = value; }
    public Instant getPublishedAt() { return publishedAt; }
    public void setPublishedAt(Instant value) { publishedAt = value; }
    public Integer getRecipientCount() { return recipientCount; }
    public void setRecipientCount(Integer value) { recipientCount = value; }
}
