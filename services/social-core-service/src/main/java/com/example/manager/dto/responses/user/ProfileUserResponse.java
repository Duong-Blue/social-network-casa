package com.example.manager.dto.responses.user;

import lombok.Data;

import java.util.Date;

@Data
public class ProfileUserResponse {
    private String userId;
    private String username;
    private String profilePicture;
    private String bio;
    private Integer numberPost;
    private Integer numberFollower;
    private Integer numberFollowing;
    private Date createdAt;
    private Boolean isLocked;
}
