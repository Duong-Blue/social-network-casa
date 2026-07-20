package com.example.manager.dto.requests.post;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class HandleReportRequest {
    @NotBlank(message = "Status is required")
    private String status; // APPROVED or REJECTED
}
