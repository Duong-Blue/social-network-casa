package com.example.manager.services;

import com.example.manager.dto.requests.comment.CommentRequest;
import com.example.manager.dto.responses.comment.CommentItemResponse;
import com.example.manager.dto.requests.comment.UpdateCommentRequest;
import com.example.manager.models.CommentEntity;
import com.example.manager.models.PostEntity;
import com.example.manager.models.UserEntity;
import com.example.manager.repositories.CommentRepository;
import com.example.manager.repositories.LikeRepository;
import com.example.manager.repositories.PostRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CommentService {
    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private ExternalNotificationService notificationService;

    @Autowired
    private ModelMapper modelMapper;

    public CommentItemResponse createComment(CommentRequest commentRequest){
        CommentEntity commentEntity = modelMapper.map(commentRequest,CommentEntity.class);
        PostEntity postEntity = postRepository.findById(commentRequest.getPostId())
                        .orElseThrow(() -> new RuntimeException("Post not found with id: " + commentRequest.getPostId()));
        UserEntity userEntity = userService.getUserById(commentRequest.getUserId());
        commentEntity.setPostId(postEntity.getPostId());
        commentEntity.setUser(userEntity);
        
        String parentId = commentRequest.getParentCommentId();
        if (parentId == null || parentId.trim().isEmpty()) {
            commentEntity.setParentCommentId(null);
        } else {
            commentEntity.setParentCommentId(parentId);
        }

        CommentEntity comment = commentRepository.save(commentEntity);

        // ── Gửi thông báo ──
        try {
            if (comment.getParentCommentId() == null) {
                // Bình luận bài viết
                Map<String, Object> data = new HashMap<>();
                data.put("type", "COMMENT_POST");
                notificationService.notifyComment(
                    postEntity.getUser().getUserId(), 
                    userEntity.getUserId(), 
                    userEntity.getUsername(), 
                    postEntity.getPostId(), 
                    comment.getContent()
                );
            } else {
                // Trả lời bình luận
                CommentEntity parentComment = commentRepository.findById(comment.getParentCommentId()).orElse(null);
                if (parentComment != null) {
                    notificationService.notifyReply(
                        parentComment.getUser().getUserId(),
                        userEntity.getUserId(),
                        userEntity.getUsername(),
                        postEntity.getPostId(),
                        comment.getContent()
                    );
                }
            }
        } catch (Exception e) {
            System.err.println("⚠️ Lỗi gửi thông báo comment: " + e.getMessage());
        }

        CommentItemResponse commentItemResponse = modelMapper.map(comment, CommentItemResponse.class);
        commentItemResponse.setUser(userService.getUserByIdResponse(commentRequest.getUserId()));
        commentItemResponse.setPostId(comment.getPostId());
        commentItemResponse.setParentCommentId(comment.getParentCommentId());
        commentItemResponse.setNumberLikeComment(0);
        commentItemResponse.setNumberReplyComment(0);
        return commentItemResponse;
    }

    public Page<CommentItemResponse> getAllCommentByPost(String postId,int page,int size){
        Pageable pageable = PageRequest.of(page, size);
        Page<CommentEntity> comments = commentRepository.getAllCommentByPost(postId,pageable);
        return comments.map(this::convertCommentResponse);
    }

    public CommentItemResponse convertCommentResponse(CommentEntity comment){
        CommentItemResponse commentItemResponse = modelMapper.map(comment,CommentItemResponse.class);
        commentItemResponse.setUser(userService.getUserByIdResponse(comment.getUser().getUserId()));
        commentItemResponse.setPostId(comment.getPostId());
        commentItemResponse.setParentCommentId(comment.getParentCommentId());
        commentItemResponse.setNumberLikeComment(likeRepository.countLikeComment(comment.getCommentId()));
        commentItemResponse.setNumberReplyComment(commentRepository.countReplyCommentByCommentParent(comment.getCommentId()));
        return commentItemResponse;
    }

    public CommentItemResponse updateComment(String commentId, UpdateCommentRequest request) {
        CommentEntity comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy commment"));

        if(!comment.getUser().getUserId().equals(request.getUserId())) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa comment này");
        }

        comment.setContent(request.getContent());
        comment.setUpdatedAt(new Timestamp(System.currentTimeMillis()));
        CommentEntity updatedComment = commentRepository.save(comment);
        return convertCommentResponse(updatedComment);
    }

    public Boolean deleteComment(String commentId, String requesterId){
        CommentEntity comment = commentRepository.findById(commentId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy commment"));

        if(requesterId == null || requesterId.isEmpty()) {
            throw new RuntimeException("Thiếu thông tin người yêu cầu xóa comment");
        }

        boolean isCommentOwner = comment.getUser().getUserId().equals(requesterId);

        if(!isCommentOwner) {
            PostEntity postEntity = postRepository.findById(comment.getPostId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));
            boolean isPostOwner = postEntity.getUser().getUserId().equals(requesterId);
            if(!isPostOwner) {
                throw new RuntimeException("Bạn không có quyền xóa comment này");
            }
        }

        deleteRepliesRecursively(commentId);

        commentRepository.delete(comment);
        return true;
    }

    public  Page<CommentItemResponse> getAllCommentReplyByCommentParent(String commentId,int page,int size){
        Pageable pageable = PageRequest.of(page,size);
        Page<CommentEntity> comments = commentRepository.getAllCommentReplyByCommentParent(commentId,pageable);
        return comments.map(this::convertCommentResponse);
    }

    private void deleteRepliesRecursively(String commentId) {
        List<CommentEntity> replies = commentRepository.findAllByParentCommentId(commentId);
        if(replies == null || replies.isEmpty()) {
            return;
        }

        for(CommentEntity reply : replies) {
            deleteRepliesRecursively(reply.getCommentId());
            commentRepository.delete(reply);
        }
    }
}
