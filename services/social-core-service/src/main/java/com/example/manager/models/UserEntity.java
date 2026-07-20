package com.example.manager.models;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@Entity
@Table(name = "users")
public class UserEntity {
    @Id
    @UuidGenerator
    private String userId;

    @Column(unique = true, nullable = false, length = 100)
    private String username;

    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(length = 255)
    private String profilePicture;

    public String getProfilePicture() {
        if (profilePicture == null || profilePicture.trim().isEmpty()) {
            return profilePicture;
        }
        if (profilePicture.startsWith("http://") || profilePicture.startsWith("https://")) {
            if (profilePicture.contains("/casa/")) {
                int idx = profilePicture.indexOf("/casa/");
                return profilePicture.substring(idx);
            }
        }
        return profilePicture;
    }

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(updatable = false)
    private Timestamp createdAt = new Timestamp(System.currentTimeMillis());

    private Timestamp updatedAt = new Timestamp(System.currentTimeMillis());

    //các role
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL,fetch = FetchType.LAZY,orphanRemoval = true)
    private List<UserRoleEntity> userRoles = new ArrayList<>();

    //các ba đăng
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL,fetch = FetchType.LAZY)
    private List<PostEntity> posts = new ArrayList<>();

    //danh sách like
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL,fetch = FetchType.LAZY, orphanRemoval = true)
    private List<LikeEntity> likes = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL,fetch = FetchType.LAZY, orphanRemoval = true)
    private List<CommentEntity> comments = new ArrayList<>(); // Danh sách bình luận của người dùng

    @OneToMany(mappedBy = "following", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<FollowEntity> followers = new ArrayList<>(); // Những người đang theo dõi user này

    @OneToMany(mappedBy = "follower", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<FollowEntity> following = new ArrayList<>(); // Những người user này đang theo dõi

    @Column(name = "is_show_share")
    private Boolean isShowShare = true;

    @Column(name = "reset_password_token", length = 10000)
    private String resetPasswordToken;

    @Column(name = "reset_password_expires")
    private Date resetPasswordExpires;

    @Column(name = "is_locked", nullable = false)
    private Boolean isLocked = false;
}
