package com.example.manager.dto.requests.admin;

import lombok.Data;

@Data
public class LockUserRequest {
    private String userId;
    private Boolean isLocked;
}

