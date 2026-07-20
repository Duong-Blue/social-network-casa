package com.example.manager.services;


import com.example.manager.dto.requests.role.CreateRoleRequest;
import com.example.manager.dto.requests.role.UpdateRoleRequest;
import com.example.manager.dto.responses.role.RoleResponse;
import com.example.manager.models.RoleEntity;
import com.example.manager.repositories.RoleRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoleService {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ModelMapper modelMapper;

    public List<RoleResponse> getAllRole(){
        List<RoleEntity> roles = roleRepository.findAll();
        return roles.stream()
                .map(role -> modelMapper.map(role,RoleResponse.class))
                .collect(Collectors.toList());
    }

    public RoleResponse createRole(CreateRoleRequest createRoleRequest){
        RoleEntity roles = modelMapper.map(createRoleRequest,RoleEntity.class);
        RoleEntity newRole = roleRepository.save(roles);
        return modelMapper.map(newRole,RoleResponse.class);
    }

    public RoleResponse getItemRole(String id){
        RoleEntity roles = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));
        return modelMapper.map(roles,RoleResponse.class);
    }

    public RoleResponse updateRole(String id, UpdateRoleRequest updateRoleRequest){
        RoleEntity roles = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));
        roles.setRoleName(updateRoleRequest.getRoleName());
        roleRepository.save(roles);
        return modelMapper.map(roles,RoleResponse.class);
    }

    public Boolean deleteRole(String id){
        RoleEntity roles = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));
        roleRepository.delete(roles);
        return true;
    }
}
