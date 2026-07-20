package com.example.manager.repositories;

import com.example.manager.models.UnblockRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UnblockRequestRepository extends JpaRepository<UnblockRequestEntity, String> {
    List<UnblockRequestEntity> findByStatus(String status);
    List<UnblockRequestEntity> findByUserUserId(String userId);
    Optional<UnblockRequestEntity> findByUserUserIdAndStatus(String userId, String status);
}

