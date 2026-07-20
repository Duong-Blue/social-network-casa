package com.example.manager.models;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Table(name = "posts")
public class PostEntity {
    @Id
    @UuidGenerator
    private String postId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(updatable = false)
    private Timestamp createdAt = new Timestamp(System.currentTimeMillis());

    private Timestamp updatedAt = new Timestamp(System.currentTimeMillis());

    @Column(name = "is_public_post", nullable = false)
    private Boolean isPublicPost = true; // Giữ lại để tương thích ngược

    @Column(name = "privacy_level", length = 50)
    private String privacyLevel = "PUBLIC"; // PUBLIC, FRIENDS, FRIENDS_OF_FRIENDS, PRIVATE

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "shared_post_id")
    private PostEntity sharedPost;

    @Column(name = "is_public_comment", nullable = false)
    private Boolean isPublicComment = true;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ShareEntity> shares = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MediaEntity> mediaList = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PostReportEntity> reports = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LikeEntity> likes = new ArrayList<>();

    // Optional: Helper methods
    public void removeAllShares() {
        this.shares.forEach(share -> share.setPost(null));
        this.shares.clear();
    }

    public void removeAllMedia() {
        this.mediaList.forEach(media -> media.setPost(null));
        this.mediaList.clear();
    }

    public void removeAllReports() {
        this.reports.forEach(report -> report.setPost(null));
        this.reports.clear();
    }
}
