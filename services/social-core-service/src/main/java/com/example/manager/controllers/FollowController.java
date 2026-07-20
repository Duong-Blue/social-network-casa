package com.example.manager.controllers;

import com.example.manager.dto.responses.Follow.UserFollowResponse;
import com.example.manager.dto.responses.common.ApiResponse;
import com.example.manager.services.FollowService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/follows")
public class FollowController {
    private final FollowService followService;

    public FollowController(FollowService followService) {
        this.followService = followService;
    }

    // ── POST /follows/{followerId}/follow/{followingId} ──
    // Idempotent: trả 200 cả khi đã follow rồi (data=false) hoặc vừa follow (data=true)
    @PostMapping("/{followerId}/follow/{followingId}")
    public ResponseEntity<ApiResponse<Boolean>> followUser(
            @PathVariable("followerId") String followerId,
            @PathVariable("followingId") String followingId) {
        boolean created = followService.followUser(followerId, followingId);
        String message = created ? "Follow thành công!" : "Bạn đã theo dõi người dùng này!";
        return ResponseEntity.ok(new ApiResponse<>(200, message, created));
    }

    // ── DELETE /follows/{followerId}/unfollow/{followingId} ──
    // Idempotent: trả 200 cả khi đã unfollow rồi (data=false) hoặc vừa unfollow (data=true)
    @DeleteMapping("/{followerId}/unfollow/{followingId}")
    public ResponseEntity<ApiResponse<Boolean>> unfollowUser(
            @PathVariable("followerId") String followerId,
            @PathVariable("followingId") String followingId) {
        boolean removed = followService.unfollowUser(followerId, followingId);
        String message = removed ? "Unfollow thành công!" : "Bạn chưa theo dõi người dùng này!";
        return ResponseEntity.ok(new ApiResponse<>(200, message, removed));
    }

    // ── GET /follows/{userId}/followers ──
    @GetMapping("/{userId}/followers")
    public ResponseEntity<ApiResponse<List<UserFollowResponse>>> getFollowers(@PathVariable("userId") String userId) {
        List<UserFollowResponse> followers = followService.getFollowers(userId);
        return ResponseEntity.ok(new ApiResponse<>(200, "Lấy danh sách người theo dõi thành công!", followers));
    }

    // ── GET /follows/{userId}/following ──
    @GetMapping("/{userId}/following")
    public ResponseEntity<ApiResponse<List<UserFollowResponse>>> getFollowing(@PathVariable("userId") String userId) {
        List<UserFollowResponse> following = followService.getFollowing(userId);
        return ResponseEntity.ok(new ApiResponse<>(200, "Lấy danh sách đang theo dõi thành công!", following));
    }

    // ── GET /follows/check?followerId=...&followingId=... ──
    @GetMapping("/check")
    public ResponseEntity<ApiResponse<Boolean>> checkFollowing(
            @RequestParam("followerId") String followerId,
            @RequestParam("followingId") String followingId) {
        boolean isFollowing = followService.isFollowing(followerId, followingId);
        return ResponseEntity.ok(new ApiResponse<>(200, "Kiểm tra follow thành công!", isFollowing));
    }
}
