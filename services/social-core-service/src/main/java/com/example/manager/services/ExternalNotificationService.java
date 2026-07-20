package com.example.manager.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;

@Service
public class ExternalNotificationService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${notification.service.url:http://communication-service:3000}")
    private String notificationServiceUrl;

    private String getNotificationUrl() {
        return notificationServiceUrl + "/notifications";
    }

    public void sendNotification(String userId, String actorId, String title, String content, Map<String, Object> data) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userId", userId);
            request.put("actor", actorId);
            request.put("title", title);
            request.put("content", content);
            request.put("data", data);

            restTemplate.postForEntity(getNotificationUrl(), request, Map.class);
            System.out.println("✅ Notification sent to Node.js for user: " + userId);
        } catch (Exception e) {
            System.err.println("❌ Failed to send notification to Node.js: " + e.getMessage());
        }
    }

    public void notifyLike(String postOwnerId, String actorId, String actorName, String postId) {
        if (postOwnerId.equals(actorId)) return; // Không thông báo cho chính mình

        String title = "Lượt thích mới";
        String content = actorName + " đã thích bài viết của bạn.";
        
        Map<String, Object> data = new HashMap<>();
        data.put("type", "LIKE_POST");
        data.put("postId", postId);
        
        sendNotification(postOwnerId, actorId, title, content, data);
    }

    public void notifyComment(String postOwnerId, String actorId, String actorName, String postId, String commentContent) {
        if (postOwnerId.equals(actorId)) return;

        String title = "Bình luận mới";
        String content = actorName + " đã bình luận về bài viết của bạn: \"" + truncate(commentContent) + "\"";
        
        Map<String, Object> data = new HashMap<>();
        data.put("type", "COMMENT_POST");
        data.put("postId", postId);
        
        sendNotification(postOwnerId, actorId, title, content, data);
    }

    public void notifyReply(String parentCommentOwnerId, String actorId, String actorName, String postId, String replyContent) {
        if (parentCommentOwnerId.equals(actorId)) return;

        String title = "Phản hồi mới";
        String content = actorName + " đã trả lời bình luận của bạn: \"" + truncate(replyContent) + "\"";
        
        Map<String, Object> data = new HashMap<>();
        data.put("type", "REPLY_COMMENT");
        data.put("postId", postId);
        
        sendNotification(parentCommentOwnerId, actorId, title, content, data);
    }

    public void notifyFollow(String followedUserId, String actorId, String actorName) {
        if (followedUserId.equals(actorId)) return;

        String title = "Người theo dõi mới";
        String content = actorName + " đã theo dõi bạn.";

        Map<String, Object> data = new HashMap<>();
        data.put("type", "FOLLOW");

        sendNotification(followedUserId, actorId, title, content, data);
    }

    public void notifyTag(String taggedUserId, String actorId, String actorName, String postId) {
        if (taggedUserId.equals(actorId)) return;

        String title = "Bạn được nhắc đến";
        String content = actorName + " đã nhắc đến bạn trong một bài viết.";

        Map<String, Object> data = new HashMap<>();
        data.put("type", "TAG_POST");
        data.put("postId", postId);

        sendNotification(taggedUserId, actorId, title, content, data);
    }

    private String truncate(String text) {
        if (text == null) return "";
        return text.length() > 50 ? text.substring(0, 47) + "..." : text;
    }
}
