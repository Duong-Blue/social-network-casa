package com.example.manager.dto.responses.search;

import com.example.manager.dto.responses.post.PostResponse;
import com.example.manager.dto.responses.user.UserFriend;
import lombok.Data;
import java.util.List;

@Data
public class SearchResponse {
    private List<UserFriend> users;
    private List<PostResponse> posts;
    private long totalUsers;
    private long totalPosts;

    public SearchResponse(List<UserFriend> users, List<PostResponse> posts, long totalUsers, long totalPosts) {
        this.users = users;
        this.posts = posts;
        this.totalUsers = totalUsers;
        this.totalPosts = totalPosts;
    }
}
