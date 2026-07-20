package com.example.manager.repositories;

import com.example.manager.models.ShareEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ShareRepository  extends JpaRepository<ShareEntity,String> {
    @Query("SELECT share FROM ShareEntity share WHERE share.user.userId =:userId")
    Page<ShareEntity> getAllShareByUserId(@Param("userId") String userId, Pageable pageable);

    @Query("SELECT COUNT(share) FROM ShareEntity share WHERE share.post.postId =:postId")
    Integer countShareByPostId(@Param("postId") String postId);

    @Query("SELECT s.post.postId, COUNT(s) FROM ShareEntity s WHERE s.post.postId IN :postIds GROUP BY s.post.postId")
    List<Object[]> countSharesByPostIds(@Param("postIds") List<String> postIds);
}
