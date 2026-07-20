package com.example.manager.services;

import com.example.manager.dto.responses.Follow.UserFollowResponse;
import com.example.manager.models.FollowEntity;
import com.example.manager.models.UserEntity;
import com.example.manager.repositories.FollowRepository;
import com.example.manager.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FollowService {
    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    @Autowired
    private FeedCacheService feedCacheService;

    @Autowired
    private ExternalNotificationService notificationService;

    @Value("${app.celebrity-threshold:10000}")
    private int celebrityThreshold;

    public FollowService(FollowRepository followRepository, UserRepository userRepository) {
        this.followRepository = followRepository;
        this.userRepository = userRepository;
    }


    // ── Follow một người dùng (idempotent: không lỗi nếu đã follow rồi) ──
    @Transactional
    public boolean followUser(String followerId, String followingId) {
        if (followerId.equals(followingId)) {
            throw new RuntimeException("Không thể tự follow bản thân!");
        }

        // Kiểm tra bằng ID, không cần load toàn bộ UserEntity
        if (followRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            // Idempotent: đã follow rồi → trả về false (đã tồn tại), không throw lỗi
            return false;
        }

        // Chỉ load UserEntity khi cần tạo mới
        UserEntity follower = userRepository.findById(followerId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại: " + followerId));
        UserEntity following = userRepository.findById(followingId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại: " + followingId));

        FollowEntity follow = new FollowEntity();
        follow.setFollower(follower);
        follow.setFollowing(following);
        followRepository.save(follow);

        notificationService.notifyFollow(followingId, followerId, follower.getUsername());

        return true;
    }

    // ── Unfollow một người dùng (idempotent: không lỗi nếu chưa follow) ──
    @Transactional
    public boolean unfollowUser(String followerId, String followingId) {
        return followRepository.findByFollowerIdAndFollowingId(followerId, followingId)
                .map(follow -> {
                    followRepository.delete(follow);
                    
                    // TÍCH HỢP XÓA CACHE FEED (VỚI TRY-CATCH FALLBACK AN TOÀN)
                    try {
                        long followerCountOfTarget = followRepository.countFollowersByUserId(followingId);
                        if (followerCountOfTarget < celebrityThreshold) { // Nếu dưới ngưỡng followers (không phải Celebrity)
                            feedCacheService.deletePushedPosts(followerId, followingId);
                        }
                    } catch (Exception e) {
                        // Chỉ ghi log cảnh báo, không chặn hoặc rollback giao dịch Unfollow DB chính
                        System.err.println("Lỗi khi dọn dẹp Feed Cache sau khi Unfollow: " + e.getMessage());
                    }
                    
                    return true;
                })
                .orElse(false); // Idempotent: chưa follow → trả false, không throw lỗi
    }

    // ── Đếm followers bằng SQL COUNT (không load lazy collection) ──
    public long countFollowers(String userId) {
        return followRepository.countFollowersByUserId(userId);
    }

    // ── Đếm following bằng SQL COUNT ──
    public long countFollowing(String userId) {
        return followRepository.countFollowingByUserId(userId);
    }

    // ── Check xem currentUser có follow targetUser không ──
    public boolean isFollowing(String followerId, String followingId) {
        return followRepository.existsByFollowerIdAndFollowingId(followerId, followingId);
    }

    // ── Lấy danh sách followers ──
    public List<UserFollowResponse> getFollowers(String userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại: " + userId));
        return followRepository.findByFollowing(user).stream()
                .map(follow -> {
                    UserEntity follower = follow.getFollower();
                    return new UserFollowResponse(
                            follower.getUserId(),
                            follower.getUsername(),
                            follower.getEmail(),
                            follower.getProfilePicture()
                    );
                })
                .collect(Collectors.toList());
    }

    // ── Lấy danh sách following ──
    public List<UserFollowResponse> getFollowing(String userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại: " + userId));
        return followRepository.findByFollower(user).stream()
                .map(follow -> {
                    UserEntity followingUser = follow.getFollowing();
                    return new UserFollowResponse(
                            followingUser.getUserId(),
                            followingUser.getUsername(),
                            followingUser.getEmail(),
                            followingUser.getProfilePicture()
                    );
                })
                .collect(Collectors.toList());
    }
}
