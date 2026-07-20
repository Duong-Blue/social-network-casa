package com.example.manager.dto.responses.user;

import com.example.manager.dto.responses.role.RoleResponse;
import lombok.Data;
import java.util.List;

@Data
public class UserRoleResponse {
    private String userId;
    private String username;
    private List<RoleResponse> roles;
}
