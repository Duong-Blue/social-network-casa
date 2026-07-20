package com.example.manager.controllers;

import com.example.manager.dto.requests.like.LikeCommentRequest;
import com.example.manager.dto.requests.like.LikePostRequest;
import com.example.manager.dto.responses.common.ApiResponse;
import com.example.manager.services.LikeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/like")
public class LikeController {
    @Autowired
    public LikeService likeService;

    @PostMapping("/post")
    public ResponseEntity<ApiResponse<Boolean>> likePost(@Valid @RequestBody LikePostRequest likeRequest) {
        Boolean likePost = likeService.likePost(likeRequest);
        if (likePost) {
            return ResponseEntity.ok(new ApiResponse<>(200, "Đã like bài viết", true));
        } else {
            return ResponseEntity.ok(new ApiResponse<>(200, "Đã hủy like bài viết", false));
        }
    }

    @PostMapping("/comment")
    public ResponseEntity<?> likeComment(@Valid @RequestBody LikeCommentRequest likeCommentRequest) {
        Boolean likeComment = likeService.likeComment(likeCommentRequest);
        if (likeComment) {
            return ResponseEntity.ok(new ApiResponse<>(200, "Đã like comment", true));
        } else {
            return ResponseEntity.ok(new ApiResponse<>(200, "Đã hủy like comment", false));
        }
    }



}
