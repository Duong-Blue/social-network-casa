package com.example.manager.repositories;

import com.example.manager.models.MediaEntity;
import com.example.manager.models.PostEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MediaRepository extends JpaRepository<MediaEntity,String> {
    @Query("SELECT m FROM MediaEntity m WHERE m.post = :post ORDER BY COALESCE(m.displayOrder, 999999) ASC")
    List<MediaEntity> findByPostOrderByDisplayOrderAsc(@Param("post") PostEntity postEntity);
    
    // Giữ lại method cũ để tương thích ngược (nếu có code khác đang dùng)
    @Deprecated
    List<MediaEntity> findByPost(PostEntity postEntity);
}
