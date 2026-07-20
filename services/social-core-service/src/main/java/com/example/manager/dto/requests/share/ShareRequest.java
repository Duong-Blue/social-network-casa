package com.example.manager.dto.requests.share;

import lombok.Data;

@Data
public class ShareRequest {
    private String userId;
    private String postId;
}
