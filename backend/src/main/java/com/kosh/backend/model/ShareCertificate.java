package com.kosh.backend.model;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "share_certificates")
public class ShareCertificate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    @JoinColumn(name = "network_id")
    private Network network;
    @ManyToOne(optional = false)
    @JoinColumn(name = "member_id")
    private User member;
    private String certificateNumber;
    private Integer sharesHeld;
    private LocalDate issuedDate;
    private String status;

    public Long getId() { return id; }
    public Network getNetwork() { return network; }
    public void setNetwork(Network network) { this.network = network; }
    public User getMember() { return member; }
    public void setMember(User member) { this.member = member; }
    public String getCertificateNumber() { return certificateNumber; }
    public void setCertificateNumber(String certificateNumber) { this.certificateNumber = certificateNumber; }
    public Integer getSharesHeld() { return sharesHeld; }
    public void setSharesHeld(Integer sharesHeld) { this.sharesHeld = sharesHeld; }
    public LocalDate getIssuedDate() { return issuedDate; }
    public void setIssuedDate(LocalDate issuedDate) { this.issuedDate = issuedDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
