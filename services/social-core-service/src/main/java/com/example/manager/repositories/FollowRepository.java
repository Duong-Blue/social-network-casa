package com.example.manager.repositories;

import com.example.manager.models.FollowEntity;
import com.example.manager.models.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<FollowEntity, String> {
    boolean existsByFollowerAndFollowing(UserEntity follower, UserEntity following);

    Optional<FollowEntity> findByFollowerAndFollowing(UserEntity follower, UserEntity following);

    List<FollowEntity> findByFollowing(UserEntity following);

    List<FollowEntity> findByFollower(UserEntity follower);

    // ── Tối ưu: đếm trực tiếp bằng SQL, không load collection ──
    @Query("SELECT COUNT(f) FROM FollowEntity f WHERE f.following.userId = :userId")
    long countFollowersByUserId(@Param("userId") String userId);

    @Query("SELECT COUNT(f) FROM FollowEntity f WHERE f.follower.userId = :userId")
    long countFollowingByUserId(@Param("userId") String userId);

    @Query("SELECT COUNT(f) > 0 FROM FollowEntity f WHERE f.follower.userId = :followerId AND f.following.userId = :followingId")
    boolean existsByFollowerIdAndFollowingId(@Param("followerId") String followerId, @Param("followingId") String followingId);

    @Query("SELECT f FROM FollowEntity f WHERE f.follower.userId = :followerId AND f.following.userId = :followingId")
    Optional<FollowEntity> findByFollowerIdAndFollowingId(@Param("followerId") String followerId, @Param("followingId") String followingId);

    @Query("SELECT COUNT(f) > 0 FROM FollowEntity f WHERE f.follower.userId = :id1 AND f.following.userId = :id2 " +
           "AND EXISTS (SELECT 1 FROM FollowEntity f2 WHERE f2.follower.userId = :id2 AND f2.following.userId = :id1)")
    boolean isMutualFriend(@Param("id1") String id1, @Param("id2") String id2);

    @Query("SELECT COUNT(f1) > 0 FROM FollowEntity f1 " +
           "WHERE f1.follower.userId = :viewerId " +
           "AND EXISTS (SELECT 1 FROM FollowEntity f2 WHERE f2.follower.userId = f1.following.userId AND f2.following.userId = :viewerId) " +
           "AND EXISTS (SELECT 1 FROM FollowEntity f3 WHERE f3.follower.userId = f1.following.userId AND f3.following.userId = :ownerId) " +
           "AND EXISTS (SELECT 1 FROM FollowEntity f4 WHERE f4.follower.userId = :ownerId AND f4.following.userId = f1.following.userId)")
    boolean areFriendsOfFriends(@Param("viewerId") String viewerId, @Param("ownerId") String ownerId);

    @Query("SELECT f.follower.userId FROM FollowEntity f WHERE f.following.userId = :userId")
    List<String> findFollowerIdsByFollowingId(@Param("userId") String userId);

    @Query("SELECT f.following.userId FROM FollowEntity f WHERE f.follower.userId = :userId")
    List<String> findFollowingIdsByFollowerId(@Param("userId") String userId);
}


