package com.example.manager.repositories;

import com.example.manager.models.PostEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<PostEntity, String> {
    @Query("SELECT p FROM PostEntity p WHERE p.user.userId = :userId AND p.isPublicPost = TRUE ORDER BY p.createdAt DESC")
    Page<PostEntity> findAllByUserId(@Param("userId") String userId, Pageable pageable);

    @Query("SELECT p FROM PostEntity p WHERE p.user.userId = :userId AND p.isPublicPost = FALSE")
    Page<PostEntity> findAllPrivatePostByUserId(@Param("userId") String userId, Pageable pageable);

    @Query("SELECT p FROM PostEntity p WHERE p.isPublicPost = TRUE ORDER BY p.createdAt DESC")
    Page<PostEntity> findAllPublicPostsPaged(Pageable pageable);

    @Query("SELECT p FROM PostEntity p WHERE p.user.userId = :currentUserId " +
           "OR p.isPublicPost = TRUE " +
           "ORDER BY p.createdAt DESC")
    Page<PostEntity> findNewsFeedFallback(@Param("currentUserId") String currentUserId, Pageable pageable);

    @Query("SELECT p FROM PostEntity p WHERE p.isPublicPost = TRUE")
    List<PostEntity> findAllPublicPosts();

    @Query("SELECT p FROM PostEntity p WHERE p.isPublicPost = TRUE AND LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY p.createdAt DESC")
    Page<PostEntity> searchByContent(@Param("keyword") String keyword, Pageable pageable);

    long countBySharedPostPostId(String sharedPostId);

    @Query("SELECT p.sharedPost.postId, COUNT(p) FROM PostEntity p WHERE p.sharedPost.postId IN :postIds GROUP BY p.sharedPost.postId")
    List<Object[]> countSharesBySharedPostIds(@Param("postIds") List<String> postIds);
}
