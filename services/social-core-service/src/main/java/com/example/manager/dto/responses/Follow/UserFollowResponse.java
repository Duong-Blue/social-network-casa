package com.example.manager.dto.responses.Follow;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserFollowResponse {
    private String userId;
    private String username;
    private String email;
    private String profilePicture;
}
