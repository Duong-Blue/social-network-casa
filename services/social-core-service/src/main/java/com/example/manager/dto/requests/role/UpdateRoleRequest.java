package com.example.manager.dto.requests.role;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class UpdateRoleRequest {
    @NotEmpty(message = "Bắt buộc phải có role name")
    private String roleName;
}

