package com.example.manager.dto.requests.like;

import lombok.Data;

@Data
public class LikeCommentRequest {
    private String userId;
    private String commentId;
}
