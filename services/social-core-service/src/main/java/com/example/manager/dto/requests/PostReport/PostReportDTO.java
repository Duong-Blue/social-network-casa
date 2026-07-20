package com.example.manager.dto.requests.PostReport;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PostReportDTO {
    private String reportId;
    private PostDTO post;
    private UserDTO reporter;
    private String reason;
    private String description;
    private String status;
    private String createdAt;
}

