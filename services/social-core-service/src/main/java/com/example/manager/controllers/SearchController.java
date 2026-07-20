package com.example.manager.controllers;

import com.example.manager.dto.responses.common.ApiResponse;
import com.example.manager.dto.responses.post.PostResponse;
import com.example.manager.dto.responses.search.SearchResponse;
import com.example.manager.dto.responses.user.UserFriend;
import com.example.manager.services.PostService;
import com.example.manager.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/search")
public class SearchController {

    @Autowired
    private UserService userService;

    @Autowired
    private PostService postService;

    private String getCurrentUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        try {
            if (authentication.getCredentials() instanceof org.springframework.security.oauth2.jwt.Jwt) {
                org.springframework.security.oauth2.jwt.Jwt jwt = (org.springframework.security.oauth2.jwt.Jwt) authentication.getCredentials();
                return (String) jwt.getClaims().get("userId");
            }
        } catch (Exception e) {
            // Ignore
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<SearchResponse>> search(
            @RequestParam("q") String query,
            @RequestParam(defaultValue = "all") String type,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        String currentUserId = getCurrentUserId(authentication);
        int adjustedPage = page - 1;

        List<UserFriend> users = List.of();
        List<PostResponse> posts = List.of();
        long totalUsers = 0;
        long totalPosts = 0;

        if ("all".equalsIgnoreCase(type) || "users".equalsIgnoreCase(type)) {
            Page<UserFriend> userPage = userService.getUsers(query, adjustedPage, size);
            users = userPage.getContent();
            totalUsers = userPage.getTotalElements();
        }

        if ("all".equalsIgnoreCase(type) || "posts".equalsIgnoreCase(type)) {
            Page<PostResponse> postPage = postService.searchPosts(query, adjustedPage, size, currentUserId);
            posts = postPage.getContent();
            totalPosts = postPage.getTotalElements();
        }

        SearchResponse data = new SearchResponse(users, posts, totalUsers, totalPosts);
        return ResponseEntity.ok(new ApiResponse<>(200, "Search success", data));
    }
}
