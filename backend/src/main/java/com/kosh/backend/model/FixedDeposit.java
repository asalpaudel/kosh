package com.kosh.backend.model;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

@Entity
@Table(name = "fixed_deposits")
public class FixedDeposit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    @Column(precision = 5, scale = 2)
    private BigDecimal interestRate;
    private Integer minDuration;
    @Column(precision = 18, scale = 2)
    private BigDecimal minAmount;
    
    @Column(length = 1000)
    private String description;

    @ManyToOne
    @JoinColumn(name = "network_id", nullable = false)
    private Network network;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "banner_data", columnDefinition = "bytea")
    @JsonIgnore
    private byte[] bannerData;
    
    private String bannerName;
    private String bannerType;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getInterestRate() { return interestRate; }
    public void setInterestRate(BigDecimal interestRate) { this.interestRate = interestRate; }

    public Integer getMinDuration() { return minDuration; }
    public void setMinDuration(Integer minDuration) { this.minDuration = minDuration; }

    public BigDecimal getMinAmount() { return minAmount; }
    public void setMinAmount(BigDecimal minAmount) { this.minAmount = minAmount; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Network getNetwork() { return network; }
    public void setNetwork(Network network) { this.network = network; }

    public byte[] getBannerData() { return bannerData; }
    public void setBannerData(byte[] bannerData) { this.bannerData = bannerData; }

    public String getBannerName() { return bannerName; }
    public void setBannerName(String bannerName) { this.bannerName = bannerName; }

    public String getBannerType() { return bannerType; }
    public void setBannerType(String bannerType) { this.bannerType = bannerType; }
}
