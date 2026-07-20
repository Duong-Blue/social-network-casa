package com.example.manager.dto.requests.comment;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class CommentRequest {
    @NotEmpty(message = "Phải có thông tin user")
    private String userId;

    @NotEmpty(message = "Phải có thông tin bài viết")
    private String postId;

    @NotEmpty(message = "Phải có nội dung bài viết")
    private String content;

    private String parentCommentId;
}
