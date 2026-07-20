package com.example.manager.services;

import com.example.manager.dto.requests.like.LikeCommentRequest;
import com.example.manager.dto.requests.like.LikePostRequest;
import com.example.manager.models.LikeEntity;
import com.example.manager.repositories.CommentRepository;
import com.example.manager.repositories.LikeRepository;
import jakarta.persistence.EntityManager;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.ConcurrentHashMap;

@Service
public class LikeService {
    @Autowired
    public LikeRepository likeRepository;

    @Autowired
    public CommentRepository commentRepository;

    @Autowired
    public PostService postService;

    @Autowired
    public UserService userService;

    @Autowired
    private ExternalNotificationService notificationService;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private EntityManager entityManager;

    private static final long RATE_LIMIT_MS = 1500;
    private final ConcurrentHashMap<String, Long> lastToggles = new ConcurrentHashMap<>();

    @Transactional(noRollbackFor = DataIntegrityViolationException.class)
    public Boolean likePost(LikePostRequest likeRequest){
        if (isSpam("like:" + likeRequest.getPostId() + ":" + likeRequest.getUserId())) {
            return likeRepository.findByUserAndPost(likeRequest.getPostId(), likeRequest.getUserId()).isEmpty() ? false : true;
        }

        try {
            LikeEntity like = modelMapper.map(likeRequest, LikeEntity.class);
            like.setPost(postService.getItemPostEntity(likeRequest.getPostId()));
            like.setUser(userService.getUserById(likeRequest.getUserId()));
            likeRepository.saveAndFlush(like);

            try {
                notificationService.notifyLike(
                    like.getPost().getUser().getUserId(),
                    like.getUser().getUserId(),
                    like.getUser().getUsername(),
                    like.getPost().getPostId()
                );
            } catch (Exception e) {
                System.err.println("⚠️ Lỗi gửi thông báo like: " + e.getMessage());
            }

            return true;
        } catch (DataIntegrityViolationException e) {
            entityManager.clear();
            likeRepository.deleteByUserAndPost(likeRequest.getPostId(), likeRequest.getUserId());
            return false;
        }
    }

    @Transactional(noRollbackFor = DataIntegrityViolationException.class)
    public Boolean likeComment(LikeCommentRequest likeCommentRequest){
        if (isSpam("comment:" + likeCommentRequest.getCommentId() + ":" + likeCommentRequest.getUserId())) {
            return likeRepository.findByUserAndComment(likeCommentRequest.getCommentId(), likeCommentRequest.getUserId()).isEmpty() ? false : true;
        }

        try {
            LikeEntity likeEntity = modelMapper.map(likeCommentRequest, LikeEntity.class);
            likeEntity.setComment(commentRepository.getById(likeCommentRequest.getCommentId()));
            likeEntity.setUser(userService.getUserById(likeCommentRequest.getUserId()));
            likeRepository.saveAndFlush(likeEntity);
            return true;
        } catch (DataIntegrityViolationException e) {
            entityManager.clear();
            likeRepository.deleteByUserAndComment(likeCommentRequest.getCommentId(), likeCommentRequest.getUserId());
            return false;
        }
    }

    private boolean isSpam(String key) {
        long now = System.currentTimeMillis();
        Long last = lastToggles.get(key);
        if (last != null && (now - last) < RATE_LIMIT_MS) {
            return true;
        }
        lastToggles.put(key, now);
        if (lastToggles.size() > 10000) {
            long threshold = now - 60000;
            lastToggles.values().removeIf(v -> v < threshold);
        }
        return false;
    }
}
