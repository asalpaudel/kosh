package com.kosh.backend.model;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "share_settings")
public class ShareSettings {
    @Id
    private Long networkId;

    @MapsId
    @OneToOne
    @JoinColumn(name = "network_id")
    private Network network;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal unitPrice;
    @Column(nullable = false)
    private Integer minimumShares;
    @Column(nullable = false)
    private Integer statutoryMaxShares;

    public Long getNetworkId() { return networkId; }
    public Network getNetwork() { return network; }
    public void setNetwork(Network network) { this.network = network; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public Integer getMinimumShares() { return minimumShares; }
    public void setMinimumShares(Integer minimumShares) { this.minimumShares = minimumShares; }
    public Integer getStatutoryMaxShares() { return statutoryMaxShares; }
    public void setStatutoryMaxShares(Integer statutoryMaxShares) { this.statutoryMaxShares = statutoryMaxShares; }
}
