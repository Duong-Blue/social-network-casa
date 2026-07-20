package com.example.manager.dto.responses.share;

import com.example.manager.dto.responses.post.PostResponse;
import lombok.Data;

@Data
public class ShareResponse {
    private String shareId;
    private PostResponse post;
}
