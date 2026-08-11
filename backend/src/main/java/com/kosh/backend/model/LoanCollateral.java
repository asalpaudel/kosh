package com.kosh.backend.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "loan_collaterals")
public class LoanCollateral {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "network_id") private Network network;
    @ManyToOne(optional = false) @JoinColumn(name = "loan_application_id") private LoanApplication loanApplication;
    @Column(length = 30) private String collateralType;
    @Column(precision = 18, scale = 2)
    private BigDecimal valuation;
    private String valuer;
    private LocalDate valuationDate;
    @Column(length = 500) private String documentReference;
    private String plotNumber;
    private String area;
    @Column(length = 500) private String location;
    @Column(length = 500) private String ownershipDocumentReference;
    @Column(length = 20) private String status;
    private Instant releasedAt;
    private String releasedBy;

    public Long getId() { return id; }
    public Network getNetwork() { return network; }
    public void setNetwork(Network network) { this.network = network; }
    public LoanApplication getLoanApplication() { return loanApplication; }
    public void setLoanApplication(LoanApplication loanApplication) { this.loanApplication = loanApplication; }
    public String getCollateralType() { return collateralType; }
    public void setCollateralType(String collateralType) { this.collateralType = collateralType; }
    public BigDecimal getValuation() { return valuation; }
    public void setValuation(BigDecimal valuation) { this.valuation = valuation; }
    public String getValuer() { return valuer; }
    public void setValuer(String valuer) { this.valuer = valuer; }
    public LocalDate getValuationDate() { return valuationDate; }
    public void setValuationDate(LocalDate valuationDate) { this.valuationDate = valuationDate; }
    public String getDocumentReference() { return documentReference; }
    public void setDocumentReference(String documentReference) { this.documentReference = documentReference; }
    public String getPlotNumber() { return plotNumber; }
    public void setPlotNumber(String plotNumber) { this.plotNumber = plotNumber; }
    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getOwnershipDocumentReference() { return ownershipDocumentReference; }
    public void setOwnershipDocumentReference(String value) { this.ownershipDocumentReference = value; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getReleasedAt() { return releasedAt; }
    public void setReleasedAt(Instant releasedAt) { this.releasedAt = releasedAt; }
    public String getReleasedBy() { return releasedBy; }
    public void setReleasedBy(String releasedBy) { this.releasedBy = releasedBy; }
}
