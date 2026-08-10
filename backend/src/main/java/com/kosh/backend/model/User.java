package com.kosh.backend.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String phone;
    private String role;
    private String sahakari;
    private Long sahakariId; 
    @JsonIgnore
    private String password;
    private String status = "Pending";
    private String dob; 
    private String address;

    @Column(nullable = false)
    private Double balance = 0.0;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    
    @JsonIgnore
    private String twoFactorCode; // Stores the 6-digit OTP
    private LocalDateTime twoFactorExpiry; 
    
    @JsonIgnore
    private String trustedDeviceToken; 
    private LocalDateTime trustedDeviceExpiry; 

    // ⭐ Photo as BLOB
    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "photo_data", columnDefinition = "bytea")
    @JsonIgnore
    private byte[] photoData;
    
    private String photoName;
    private String photoType;

    // ⭐ Citizenship as BLOB
    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "citizenship_data", columnDefinition = "bytea")
    @JsonIgnore
    private byte[] citizenshipData;
    
    private String citizenshipName;
    private String citizenshipType;

    // ⭐ Signature as BLOB
    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "signature_data", columnDefinition = "bytea")
    @JsonIgnore
    private byte[] signatureData;
    
    private String signatureName;
    private String signatureType;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }


    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getDob() { return dob; }
    public void setDob(String dob) { this.dob = dob; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Long getSahakariId() { return sahakariId; }
    public void setSahakariId(Long sahakariId) { this.sahakariId = sahakariId; }

    public String getSahakari() { return sahakari; }
    public void setSahakari(String sahakari) { this.sahakari = sahakari; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getBalance() { return balance != null ? balance : 0.0; }
    public void setBalance(Double balance) { this.balance = balance != null ? balance : 0.0; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // BLOB Getters
    public byte[] getPhotoData() { return photoData; }
    public void setPhotoData(byte[] photoData) { this.photoData = photoData; }
    public String getPhotoName() { return photoName; }
    public void setPhotoName(String photoName) { this.photoName = photoName; }
    public String getPhotoType() { return photoType; }
    public void setPhotoType(String photoType) { this.photoType = photoType; }

    public byte[] getCitizenshipData() { return citizenshipData; }
    public void setCitizenshipData(byte[] citizenshipData) { this.citizenshipData = citizenshipData; }
    public String getCitizenshipName() { return citizenshipName; }
    public void setCitizenshipName(String citizenshipName) { this.citizenshipName = citizenshipName; }
    public String getCitizenshipType() { return citizenshipType; }
    public void setCitizenshipType(String citizenshipType) { this.citizenshipType = citizenshipType; }

    public byte[] getSignatureData() { return signatureData; }
    public void setSignatureData(byte[] signatureData) { this.signatureData = signatureData; }
    public String getSignatureName() { return signatureName; }
    public void setSignatureName(String signatureName) { this.signatureName = signatureName; }
    public String getSignatureType() { return signatureType; }
    public void setSignatureType(String signatureType) { this.signatureType = signatureType; }

    // 2FA 
    public String getTwoFactorCode() { return twoFactorCode; }
    public void setTwoFactorCode(String twoFactorCode) { this.twoFactorCode = twoFactorCode; }
    public LocalDateTime getTwoFactorExpiry() { return twoFactorExpiry; }
    public void setTwoFactorExpiry(LocalDateTime twoFactorExpiry) { this.twoFactorExpiry = twoFactorExpiry; }
    public String getTrustedDeviceToken() { return trustedDeviceToken; }
    public void setTrustedDeviceToken(String trustedDeviceToken) { this.trustedDeviceToken = trustedDeviceToken; }
    public LocalDateTime getTrustedDeviceExpiry() { return trustedDeviceExpiry; }
    public void setTrustedDeviceExpiry(LocalDateTime trustedDeviceExpiry) { this.trustedDeviceExpiry = trustedDeviceExpiry; }
}
