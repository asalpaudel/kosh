package com.kosh.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "loan_packages")
public class LoanPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private Double interestRate;
    private Double maxAmount;
    private Integer maxDuration;

    @Column(length = 1000)
    private String description;

    @ManyToOne
    @JoinColumn(name = "network_id", nullable = false)
    private Network network;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getInterestRate() { return interestRate; }
    public void setInterestRate(Double interestRate) { this.interestRate = interestRate; }

    public Double getMaxAmount() { return maxAmount; }
    public void setMaxAmount(Double maxAmount) { this.maxAmount = maxAmount; }

    public Integer getMaxDuration() { return maxDuration; }
    public void setMaxDuration(Integer maxDuration) { this.maxDuration = maxDuration; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Network getNetwork() { return network; }
    public void setNetwork(Network network) { this.network = network; }
}
