package com.example.manager.dto.requests.post;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class PostRequest {
    @NotEmpty(message = "Cần có người dùng đăng bài")
    private String user;

    private String content;

    private String sharedPostId;

    private Boolean isPublicPost; // Giữ lại để tương thích ngược
    private String privacyLevel; // PUBLIC, FRIENDS, FRIENDS_OF_FRIENDS, PRIVATE
    private Boolean isPublicComment;
}
