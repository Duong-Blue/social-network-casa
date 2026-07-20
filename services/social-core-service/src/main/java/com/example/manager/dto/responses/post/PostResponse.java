package com.example.manager.dto.responses.post;

import com.example.manager.dto.responses.user.ItemUserResponse;
import lombok.Data;

import java.sql.Timestamp;
import java.util.List;

@Data
public class PostResponse {
    private String postId;
    private ItemUserResponse user;
    private String content;
    private Boolean isPublicPost; // Giữ lại để tương thích ngược
    private String privacyLevel; // PUBLIC, FRIENDS, FRIENDS_OF_FRIENDS, PRIVATE
    private Boolean isPublicComment;
    private List<String> mediaUrls;
    private Timestamp createdAt;
    private int numberLike;
    private int numberComment;
    private int numberShare;
    private Boolean liked;
    private Boolean isSaved = false;
    private PostResponse sharedPost;
}
