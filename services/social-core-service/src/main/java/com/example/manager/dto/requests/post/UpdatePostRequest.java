package com.example.manager.dto.requests.post;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
public class UpdatePostRequest {
    @JsonProperty("isPublicPost")
    private Boolean isPublicPost; // Giữ lại để tương thích ngược
    
    private String privacyLevel; // PUBLIC, FRIENDS, FRIENDS_OF_FRIENDS, PRIVATE

    @JsonProperty("isPublicComment")
    private Boolean isPublicComment;
    
    private String content;
}
