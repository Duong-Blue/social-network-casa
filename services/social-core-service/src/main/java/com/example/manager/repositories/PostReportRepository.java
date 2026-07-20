package com.example.manager.repositories;

import com.example.manager.models.PostEntity;
import com.example.manager.models.PostReportEntity;
import com.example.manager.models.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostReportRepository extends JpaRepository<PostReportEntity, String> {
    boolean existsByPostAndReporter(PostEntity post, UserEntity reporter);

    Page<PostReportEntity> findReportsByStatus(String status, Pageable pageable);
}
