package com.example.manager.dto.requests.user;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class UpdateProfileRequest {
    private String username;
    private String bio;
    private MultipartFile profilePicture;
}
