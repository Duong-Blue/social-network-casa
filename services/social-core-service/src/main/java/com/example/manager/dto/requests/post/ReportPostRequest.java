package com.example.manager.dto.requests.post;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReportPostRequest {
    @NotBlank(message = "User ID is required")
    private String userId;

    @NotBlank(message = "Reason is required")
    private String reason;

    private String description;
}