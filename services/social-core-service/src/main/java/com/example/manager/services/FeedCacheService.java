package com.example.manager.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations.TypedTuple;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FeedCacheService {

    @Autowired
    private StringRedisTemplate redisTemplate;

    private static final String FEED_KEY_PREFIX = "user:feed:";
    private static final String OUTBOX_KEY_PREFIX = "user:outbox:";
    private static final int MAX_FEED_SIZE = 500; // Giới hạn kích thước cache feed mỗi user

    /**
     * Push bài viết vào Feed Cache của một User (Push Model - Fan-out on Write)
     */
    public void pushToFeed(String userId, String postId, long timestamp) {
        String key = FEED_KEY_PREFIX + userId;
        redisTemplate.opsForZSet().add(key, postId, timestamp);
        
        // Giới hạn kích thước feed cache để tránh tràn RAM Redis
        Long size = redisTemplate.opsForZSet().zCard(key);
        if (size != null && size > MAX_FEED_SIZE) {
            redisTemplate.opsForZSet().removeRange(key, 0, size - MAX_FEED_SIZE - 1);
        }
    }

    /**
     * Ghi bài viết vào Outbox Cache của người đăng bài
     */
    public void pushToOutbox(String authorId, String postId, long timestamp) {
        String key = OUTBOX_KEY_PREFIX + authorId;
        redisTemplate.opsForZSet().add(key, postId, timestamp);
        
        // Giới hạn Outbox cá nhân ở mức 200 bài mới nhất
        Long size = redisTemplate.opsForZSet().zCard(key);
        if (size != null && size > 200) {
            redisTemplate.opsForZSet().removeRange(key, 0, size - 201);
        }
    }

    /**
     * Lấy danh sách Post ID từ Feed Cache của User (ZSET sắp xếp giảm dần)
     */
    public List<String> getFeedPostIds(String userId, int start, int end) {
        String key = FEED_KEY_PREFIX + userId;
        Set<String> postIds = redisTemplate.opsForZSet().reverseRange(key, start, end);
        if (postIds == null) {
            return Collections.emptyList();
        }
        return new ArrayList<>(postIds);
    }

    /**
     * Pull bài viết kèm score (timestamp) từ Outbox của một Celebrity
     */
    public List<PostIdWithScore> getOutboxPostIdsWithScores(String celebrityId, int limit) {
        String key = OUTBOX_KEY_PREFIX + celebrityId;
        Set<TypedTuple<String>> tuples = redisTemplate.opsForZSet().reverseRangeWithScores(key, 0, limit - 1);
        if (tuples == null) {
            return Collections.emptyList();
        }
        return tuples.stream()
                .map(t -> new PostIdWithScore(t.getValue(), t.getScore() != null ? t.getScore().longValue() : 0L))
                .collect(Collectors.toList());
    }

    /**
     * Xóa các bài viết đã đẩy khi người dùng thực hiện hủy follow (Unfollow)
     */
    public void deletePushedPosts(String userId, String unfollowedAuthorId) {
        String outboxKey = OUTBOX_KEY_PREFIX + unfollowedAuthorId;
        Set<String> postIds = redisTemplate.opsForZSet().reverseRange(outboxKey, 0, -1);
        
        if (postIds != null && !postIds.isEmpty()) {
            String feedKey = FEED_KEY_PREFIX + userId;
            redisTemplate.opsForZSet().remove(feedKey, postIds.toArray());
        }
    }

    /**
     * DTO đóng gói dữ liệu phục vụ trộn và sắp xếp
     */
    public static class PostIdWithScore implements Comparable<PostIdWithScore> {
        private String postId;
        private long score;

        public PostIdWithScore(String postId, long score) {
            this.postId = postId;
            this.score = score;
        }

        public String getPostId() {
            return postId;
        }

        public long getScore() {
            return score;
        }

        @Override
        public int compareTo(PostIdWithScore o) {
            return Long.compare(o.score, this.score); // Sắp xếp giảm dần theo thời gian
        }
    }
}
