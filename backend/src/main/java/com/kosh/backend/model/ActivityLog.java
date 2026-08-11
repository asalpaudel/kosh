package com.kosh.backend.model;

import java.time.Instant;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "activity_logs")
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String actorName; 
    private String role;     
    private Long sahakariId;  

    private String action;    
    private String details;  
    
    private Instant timestamp;

    public ActivityLog() {
        this.timestamp = Instant.now();
    }

    public ActivityLog(String actorName, String role, Long sahakariId, String action, String details) {
        this.actorName = actorName;
        this.role = role;
        this.sahakariId = sahakariId;
        this.action = action;
        this.details = details;
        this.timestamp = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Long getSahakariId() { return sahakariId; }
    public void setSahakariId(Long sahakariId) { this.sahakariId = sahakariId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
