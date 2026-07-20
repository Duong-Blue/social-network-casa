package com.example.manager.dto.responses.admin;

import lombok.Data;
import java.sql.Timestamp;

@Data
public class UnblockRequestResponse {
    private String requestId;
    private String userId;
    private String username;
    private String email;
    private String message;
    private String status;
    private String adminResponse;
    private Timestamp createdAt;
    private Timestamp updatedAt;
}

