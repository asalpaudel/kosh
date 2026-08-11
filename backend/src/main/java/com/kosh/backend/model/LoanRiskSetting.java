package com.kosh.backend.model;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "loan_risk_settings")
public class LoanRiskSetting {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @OneToOne(optional = false) @JoinColumn(name = "network_id") private Network network;
    private Integer watchlistDays = 1;
    private Integer substandardDays = 30;
    private Integer doubtfulDays = 90;
    private Integer lossDays = 180;
    @Column(precision = 5, scale = 2) private BigDecimal passRate = new BigDecimal("1.00");
    @Column(precision = 5, scale = 2) private BigDecimal watchlistRate = new BigDecimal("5.00");
    @Column(precision = 5, scale = 2) private BigDecimal substandardRate = new BigDecimal("25.00");
    @Column(precision = 5, scale = 2) private BigDecimal doubtfulRate = new BigDecimal("50.00");
    @Column(precision = 5, scale = 2) private BigDecimal lossRate = new BigDecimal("100.00");

    public Long getId() { return id; }
    public Network getNetwork() { return network; }
    public void setNetwork(Network network) { this.network = network; }
    public Integer getWatchlistDays() { return watchlistDays; }
    public void setWatchlistDays(Integer value) { this.watchlistDays = value; }
    public Integer getSubstandardDays() { return substandardDays; }
    public void setSubstandardDays(Integer value) { this.substandardDays = value; }
    public Integer getDoubtfulDays() { return doubtfulDays; }
    public void setDoubtfulDays(Integer value) { this.doubtfulDays = value; }
    public Integer getLossDays() { return lossDays; }
    public void setLossDays(Integer value) { this.lossDays = value; }
    public BigDecimal getPassRate() { return passRate; }
    public void setPassRate(BigDecimal value) { this.passRate = value; }
    public BigDecimal getWatchlistRate() { return watchlistRate; }
    public void setWatchlistRate(BigDecimal value) { this.watchlistRate = value; }
    public BigDecimal getSubstandardRate() { return substandardRate; }
    public void setSubstandardRate(BigDecimal value) { this.substandardRate = value; }
    public BigDecimal getDoubtfulRate() { return doubtfulRate; }
    public void setDoubtfulRate(BigDecimal value) { this.doubtfulRate = value; }
    public BigDecimal getLossRate() { return lossRate; }
    public void setLossRate(BigDecimal value) { this.lossRate = value; }
}
