package com.example.manager.repositories;

import com.example.manager.models.UserRoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepository extends JpaRepository<UserRoleEntity,String>  {
}
