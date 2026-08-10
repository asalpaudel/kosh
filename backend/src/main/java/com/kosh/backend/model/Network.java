package com.kosh.backend.model;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

@Entity
@Table(name = "networks")
public class Network {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String registeredId;
    private String name;
    private String address;
    private String createdAt;
    private String phone;
    private String panNumber;

    private Integer staffCount;
    private Integer userCount;

    private String packageType;
    @Column(precision = 18, scale = 2)
    private BigDecimal packagePrice;
    
    // ⭐ Store document as binary data
    @Column(name = "document_data", columnDefinition = "bytea")
    @JsonIgnore
    private byte[] documentData;
    
    private String documentName; // Original filename
    private String documentType; // MIME type (e.g., "application/pdf")
    
    // ⭐ Store logo as binary data
    @Column(name = "logo_data", columnDefinition = "bytea")
    @JsonIgnore
    private byte[] logoData;
    
    private String logoName; // Original filename
    private String logoType; // MIME type (e.g., "image/png")
    
    private Integer adminLimit;
    private Integer userLimit;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRegisteredId() { return registeredId; }
    public void setRegisteredId(String registeredId) { this.registeredId = registeredId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPanNumber() { return panNumber; }
    public void setPanNumber(String panNumber) { this.panNumber = panNumber; }

    public Integer getStaffCount() { return staffCount; }
    public void setStaffCount(Integer staffCount) { this.staffCount = staffCount; }

    public Integer getUserCount() { return userCount; }
    public void setUserCount(Integer userCount) { this.userCount = userCount; }

    public String getPackageType() { return packageType; }
    public void setPackageType(String packageType) { this.packageType = packageType; }

    public BigDecimal getPackagePrice() { return packagePrice; }
    public void setPackagePrice(BigDecimal packagePrice) { this.packagePrice = packagePrice; }

    public byte[] getDocumentData() { return documentData; }
    public void setDocumentData(byte[] documentData) { this.documentData = documentData; }

    public String getDocumentName() { return documentName; }
    public void setDocumentName(String documentName) { this.documentName = documentName; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public byte[] getLogoData() { return logoData; }
    public void setLogoData(byte[] logoData) { this.logoData = logoData; }

    public String getLogoName() { return logoName; }
    public void setLogoName(String logoName) { this.logoName = logoName; }

    public String getLogoType() { return logoType; }
    public void setLogoType(String logoType) { this.logoType = logoType; }

    public Integer getAdminLimit() { return adminLimit; }
    public void setAdminLimit(Integer adminLimit) { this.adminLimit = adminLimit; }

    public Integer getUserLimit() { return userLimit; }
    public void setUserLimit(Integer userLimit) { this.userLimit = userLimit; }
}
