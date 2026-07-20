package com.example.manager.dto.requests.admin;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class UnblockRequest {
    @NotEmpty(message = "Email không được để trống")
    private String email;
    
    @NotEmpty(message = "Mật khẩu không được để trống")
    private String password;
    
    @NotEmpty(message = "Message không được để trống")
    private String message;
}

