package com.example.manager.dto.requests.user;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class ChangeName {
    @NotEmpty(message = "phải có tên người dùng")
    private String username;
}
