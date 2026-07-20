package com.example.manager.repositories;

import com.example.manager.models.ShareEntity;
import com.example.manager.models.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity,String> {
    Optional<UserEntity> findByResetPasswordToken(String token);

    Optional<UserEntity> findByUserId(String userId);

    Optional<UserEntity> findByUsername(String userName);

    Optional<UserEntity> findByEmail(String email);

    Boolean existsByEmail(String userName);

    @Query("SELECT user  FROM UserEntity user WHERE user.userId = :userId")
    UserEntity profileUser(@Param("userId") String userId);

    @Query("SELECT COUNT(p) FROM PostEntity p WHERE p.user.userId = :userId AND p.isPublicPost = true")
    Long countUserPosts(@Param("userId") String userId);

    @Query("SELECT u FROM UserEntity u WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<UserEntity> searchByName(@Param("name") String name, Pageable pageable);

    @Query(value = """
        WITH daily_counts AS (
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as new_users
            FROM users
            WHERE created_at BETWEEN ?1 AND ?2
            GROUP BY DATE(created_at)
        )
        SELECT 
            date,
            SUM(new_users) OVER (ORDER BY date) as total_users,
            new_users
        FROM daily_counts
        ORDER BY date
    """, nativeQuery = true)
    List<Object[]> countUsersByDate(Timestamp startDate, Timestamp endDate);

    @Query("SELECT u FROM UserEntity u WHERE u.isLocked = true")
    Page<UserEntity> findLockedUsers(Pageable pageable);

    @Query("SELECT u FROM UserEntity u WHERE u.isLocked = true AND LOWER(u.username) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<UserEntity> findLockedUsersByName(@Param("name") String name, Pageable pageable);

}
