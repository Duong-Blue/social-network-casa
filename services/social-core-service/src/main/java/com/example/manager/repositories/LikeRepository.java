package com.example.manager.repositories;

import com.example.manager.models.LikeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LikeRepository extends JpaRepository<LikeEntity,String> {
    @Query("SELECT l  FROM LikeEntity l WHERE l.post.postId = :postId AND l.user.userId = :userId")
    List<LikeEntity> findByUserAndPost(@Param("postId") String postId,@Param("userId") String userId);

    @Query("SELECT COUNT(l) FROM LikeEntity l WHERE l.post.postId = :postId")
    Integer countLikePost(@Param("postId") String postId);

    @Query("SELECT l FROM LikeEntity l WHERE l.post.postId = :postId")
    List<LikeEntity> getAllLikeByPost(@Param("postId") String postId);

    @Query("SELECT l FROM LikeEntity l WHERE l.comment.commentId = :commentId AND l.user.userId = :userId")
    List<LikeEntity> findByUserAndComment(@Param("commentId") String commentId,@Param("userId") String userId);

    @Query("SELECT COUNT(l) FROM LikeEntity l WHERE l.comment.commentId = :commentId")
    Integer countLikeComment(@Param("commentId") String commentId);


    @Query("SELECT l.post.postId FROM LikeEntity l WHERE l.user.userId = :userId AND l.post.postId IN :postIds")
    List<String> findLikedPostIds(@Param("userId") String userId, @Param("postIds") List<String> postIds);

    @Query("SELECT l.post.postId, COUNT(l) FROM LikeEntity l WHERE l.post.postId IN :postIds GROUP BY l.post.postId")
    List<Object[]> countLikesByPostIds(@Param("postIds") List<String> postIds);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("DELETE FROM LikeEntity l WHERE l.comment.postId = :postId")
    void deleteByCommentPostId(@Param("postId") String postId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("DELETE FROM LikeEntity l WHERE l.post.postId = :postId AND l.user.userId = :userId")
    void deleteByUserAndPost(@Param("postId") String postId, @Param("userId") String userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("DELETE FROM LikeEntity l WHERE l.comment.commentId = :commentId AND l.user.userId = :userId")
    void deleteByUserAndComment(@Param("commentId") String commentId, @Param("userId") String userId);
}
