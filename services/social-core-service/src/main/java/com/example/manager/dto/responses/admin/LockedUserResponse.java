package com.example.manager.dto.responses.admin;

import lombok.Data;
import java.sql.Timestamp;

@Data
public class LockedUserResponse {
    private String userId;
    private String username;
    private String email;
    private String profilePicture;
    private Timestamp createdAt;
    private Boolean isLocked;
}

