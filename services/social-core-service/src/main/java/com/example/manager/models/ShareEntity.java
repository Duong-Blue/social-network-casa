package com.example.manager.models;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;

import java.sql.Timestamp;
@Entity
@Data
@Table(name = "shares")
public class ShareEntity {
    @Id
    @UuidGenerator
    private String shareId;

    @ManyToOne(fetch = FetchType.LAZY) // Lazy tốt hơn EAGER
    @JoinColumn(name = "post_id", nullable = false)
    private PostEntity post;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(updatable = false)
    private Timestamp createdAt = new Timestamp(System.currentTimeMillis());

    @Column(name = "is_public_share", nullable = false)
    private Boolean isPublicShare = true;
}