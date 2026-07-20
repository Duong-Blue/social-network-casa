package com.example.manager.dto.requests.comment;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class UpdateCommentRequest {
    @NotEmpty(message = "Phải có thông tin user")
    private String userId;

    @NotEmpty(message = "Phải có nội dung bình luận")
    private String content;
}

