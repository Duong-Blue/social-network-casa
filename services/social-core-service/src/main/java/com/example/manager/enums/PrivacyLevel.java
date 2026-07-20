package com.example.manager.enums;

public enum PrivacyLevel {
    PUBLIC("Công khai"),           // Ai cũng có thể xem
    FRIENDS("Bạn bè"),             // Chỉ bạn bè có thể xem
    FRIENDS_OF_FRIENDS("Bạn của bạn bè"), // Bạn bè và bạn của bạn bè có thể xem
    PRIVATE("Riêng tư");           // Chỉ mình tôi có thể xem

    private final String displayName;

    PrivacyLevel(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

