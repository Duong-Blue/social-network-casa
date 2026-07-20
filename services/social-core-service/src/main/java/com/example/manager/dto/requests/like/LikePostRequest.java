package com.example.manager.dto.requests.like;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class LikePostRequest {
    @NotEmpty(message = "Bắt buộc phải có id người like")
    private String userId;

    @NotEmpty(message = "Bắt buộc phải có id bài viết")
    private String postId;
}
