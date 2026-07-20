package com.example.manager.dto.responses.like;

import com.example.manager.dto.responses.user.ItemUserResponse;
import lombok.Data;

@Data
public class LikeItemResponse {
    private String likeId;
    private ItemUserResponse user;
}
