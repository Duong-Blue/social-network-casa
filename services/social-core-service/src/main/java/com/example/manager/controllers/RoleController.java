package com.example.manager.controllers;


import com.example.manager.dto.requests.role.CreateRoleRequest;
import com.example.manager.dto.requests.role.UpdateRoleRequest;
import com.example.manager.dto.responses.common.ApiResponse;
import com.example.manager.dto.responses.role.RoleResponse;
import com.example.manager.services.RoleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/role")
public class RoleController {

    @Autowired
    private RoleService roleService;

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getAllRole(){
        List<RoleResponse> roleResponses =  this.roleService.getAllRole();
        ApiResponse<List<RoleResponse>> apiResponse = new ApiResponse<>(200,"success",roleResponses);
        return ResponseEntity.ok(apiResponse);
    }


    @PostMapping("/create")
    public ResponseEntity<ApiResponse<RoleResponse>> createRole(@Valid @RequestBody CreateRoleRequest createRoleRequest){
        RoleResponse roleResponse = this.roleService.createRole(createRoleRequest);
        ApiResponse<RoleResponse> apiResponse = new ApiResponse<>(200,"success",roleResponse);
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/item/{id}")
    public ResponseEntity<ApiResponse<RoleResponse>> createRole(@PathVariable("id") String id){
        RoleResponse roleResponse = this.roleService.getItemRole(id);
        ApiResponse<RoleResponse> apiResponse = new ApiResponse<>(200,"success",roleResponse);
        return ResponseEntity.ok(apiResponse);
    }


    @PutMapping("/update/{id}")
    public ResponseEntity<ApiResponse<RoleResponse>> updateRole(@PathVariable("id") String id, @RequestBody UpdateRoleRequest updateRoleRequest){
        RoleResponse roleResponse = this.roleService.updateRole(id,updateRoleRequest);
        ApiResponse<RoleResponse> apiResponse = new ApiResponse<>(200,"success",roleResponse);
        return ResponseEntity.ok(apiResponse);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Boolean>> deleteRole(@PathVariable("id") String id){
        Boolean isDelete = this.roleService.deleteRole(id);
        ApiResponse<Boolean> apiResponse = new ApiResponse<>(200,"success",isDelete);
        return ResponseEntity.ok(apiResponse);
    }
}

