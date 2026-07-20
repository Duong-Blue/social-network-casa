package com.example.manager.repositories;

import com.example.manager.models.PostEntity;
import com.example.manager.models.SavedPostEntity;
import com.example.manager.models.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SavedPostRepository extends JpaRepository<SavedPostEntity, String> {
    Optional<SavedPostEntity> findByUserAndPost(UserEntity user, PostEntity post);

    boolean existsByUserAndPost(UserEntity user, PostEntity post);

    @Query("SELECT s FROM SavedPostEntity s WHERE s.user.userId = :userId")
    Page<SavedPostEntity> findByUserId(@Param("userId") String userId, Pageable pageable);

    void deleteByUserAndPost(UserEntity user, PostEntity post);

    @Query("SELECT s.post.postId FROM SavedPostEntity s WHERE s.user.userId = :userId AND s.post.postId IN :postIds")
    List<String> findSavedPostIds(@Param("userId") String userId, @Param("postIds") List<String> postIds);
}
