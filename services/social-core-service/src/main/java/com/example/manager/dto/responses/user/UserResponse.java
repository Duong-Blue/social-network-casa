package com.example.manager.dto.responses.user;

import lombok.Data;

import java.util.Collection;

@Data
public class UserResponse {
    private String userId;
    private String username;
    private String profilePicture;
    private Collection<String> roles;
}
