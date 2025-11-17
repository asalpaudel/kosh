package com.kosh.backend.model;

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

    private Integer staffCount;
    private Integer userCount;

    // ⭐ NEW FIELDS FOR PACKAGE MANAGEMENT
    private String packageType; // "package1", "package2", or "package3"
    private Double packagePrice; // Total price of the package in रु
    
    // ⭐ NEW FIELD FOR DOCUMENT
    private String documentPath; // Stores the filename of uploaded document

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

    public Integer getStaffCount() { return staffCount; }
    public void setStaffCount(Integer staffCount) { this.staffCount = staffCount; }

    public Integer getUserCount() { return userCount; }
    public void setUserCount(Integer userCount) { this.userCount = userCount; }

    public String getPackageType() { return packageType; }
    public void setPackageType(String packageType) { this.packageType = packageType; }

    public Double getPackagePrice() { return packagePrice; }
    public void setPackagePrice(Double packagePrice) { this.packagePrice = packagePrice; }

    public String getDocumentPath() { return documentPath; }
    public void setDocumentPath(String documentPath) { this.documentPath = documentPath; }

    @Override
    public String toString() {
        return "Network{" +
                "id=" + id +
                ", registeredId='" + registeredId + '\'' +
                ", name='" + name + '\'' +
                ", address='" + address + '\'' +
                ", createdAt='" + createdAt + '\'' +
                ", phone='" + phone + '\'' +
                ", staffCount=" + staffCount +
                ", userCount=" + userCount +
                ", packageType='" + packageType + '\'' +
                ", packagePrice=" + packagePrice +
                ", documentPath='" + documentPath + '\'' +
                '}';
    }
}