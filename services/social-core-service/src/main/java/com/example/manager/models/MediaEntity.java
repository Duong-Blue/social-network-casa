package com.example.manager.models;


import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;
@Entity
@Data
@Table(name = "media")
public class MediaEntity {
    @Id
    @UuidGenerator
    private String mediaId;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false, length = 50)
    private String type; // image hoặc video

    @Column(nullable = true)
    private Integer displayOrder = 0; // Thứ tự hiển thị ảnh (ảnh đầu tiên = 0)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private PostEntity post;
}