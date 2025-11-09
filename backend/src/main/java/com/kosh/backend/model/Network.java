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
    private String createdAt; // keep as String for now
    private String phone;

    private Integer staffCount; // Integer allows null
    private Integer userCount;

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
                '}';
    }
}
