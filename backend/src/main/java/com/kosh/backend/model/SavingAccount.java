package com.kosh.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "saving_accounts")
public class SavingAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private Double interestRate;
    private Double minBalance;
    
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

    public Double getMinBalance() { return minBalance; }
    public void setMinBalance(Double minBalance) { this.minBalance = minBalance; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Network getNetwork() { return network; }
    public void setNetwork(Network network) { this.network = network; }
}
