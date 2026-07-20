package com.example.manager.dto.requests.admin;

import lombok.Data;

@Data
public class HandleUnblockRequest {
    private String requestId;
    private String action; // "APPROVE" or "REJECT"
    private String adminResponse; // Optional response from admin
}

