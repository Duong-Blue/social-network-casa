package com.example.manager.repositories;

import com.example.manager.models.CommentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface CommentRepository extends JpaRepository<CommentEntity,String> {
    @Query("SELECT COUNT(c) FROM CommentEntity c WHERE c.postId = :postId")
    Integer countCommentByPost(@Param("postId") String postId);

    @Query("SELECT comment FROM CommentEntity comment WHERE comment.postId = :postId AND comment.parentCommentId IS NULL")
    Page<CommentEntity> getAllCommentByPost(@Param("postId") String postId, Pageable pageable);

    @Query("SELECT comment FROM CommentEntity comment WHERE comment.parentCommentId = :commentId")
    Page<CommentEntity> getAllCommentReplyByCommentParent(@Param("commentId") String commentId,Pageable pageable);

    List<CommentEntity> findAllByParentCommentId(String parentCommentId);

    @Query("SELECT COUNT(comment) FROM CommentEntity comment WHERE comment.parentCommentId = :commentId")
    Integer countReplyCommentByCommentParent(@Param("commentId") String commentId);

    @Query("SELECT c.postId, COUNT(c) FROM CommentEntity c WHERE c.postId IN :postIds GROUP BY c.postId")
    List<Object[]> countCommentsByPostIds(@Param("postIds") List<String> postIds);

    @Modifying
    @Transactional
    @Query("DELETE FROM CommentEntity c WHERE c.postId = :postId")
    void deleteByPostId(@Param("postId") String postId);

}