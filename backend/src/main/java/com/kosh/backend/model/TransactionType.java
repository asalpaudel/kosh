package com.kosh.backend.model;

public enum TransactionType {
    DEPOSIT("Deposit"),
    WITHDRAW("Withdraw");
    
    private final String displayName;
    
    TransactionType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}