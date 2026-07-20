package com.example.manager.services;

import com.example.manager.dto.requests.post.PostRequest;
import com.example.manager.dto.requests.post.UpdatePostRequest;
import com.example.manager.dto.responses.like.LikeItemResponse;
import com.example.manager.dto.responses.post.PostResponse;
import com.example.manager.dto.responses.user.ItemUserResponse;
import com.example.manager.models.*;
import com.example.manager.repositories.*;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.util.*;
import java.util.Comparator;
import java.util.stream.Collectors;
import java.util.function.Function;
import java.sql.Timestamp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@Service
public class PostService {

    private static final Logger log = LoggerFactory.getLogger(PostService.class);

    @Value("${app.celebrity-threshold:10000}")
    private int celebrityThreshold;

    @Autowired
    private MinioStorageService minioStorageService;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MediaRepository mediaRepository;

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private ShareRepository shareRepository;

    @Autowired
    private FollowRepository followRepository;

    @Autowired
    private FeedCacheService feedCacheService;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private SavedPostRepository savedPostRepository;

    @Autowired
    private ExternalNotificationService notificationService;

    //***
    // Thêm dữ liệu vào hàm ***** savePost  ************//
    //***
    public PostResponse savePostWithFiles(PostRequest postRequest, List<MultipartFile> files) {
        List<String> fileUrls = new ArrayList<>();
        for (MultipartFile file : files) {
            String typeFile = determineFileType(file);
            // Upload lên MinIO, trả về full URL (vd: http://minio:9000/casa/images/uuid.jpg)
            String fileUrl = minioStorageService.uploadFile(file, typeFile + "s");
            fileUrls.add(fileUrl);
        }
        return savePost(postRequest, fileUrls, files);
    }

    // Tạo post chỉ với nội dung, không có file
    public PostResponse savePostWithoutFiles(PostRequest postRequest) {
        return savePost(postRequest, new ArrayList<>(), new ArrayList<>());
    }

    //Định nghĩa file
    private String determineFileType(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is null or empty");
        }
        
        String fileName = file.getOriginalFilename();
        if (fileName == null || fileName.trim().isEmpty()) {
            // Nếu không có tên file, thử xác định từ content type
            String contentType = file.getContentType();
            if (contentType != null) {
                if (contentType.startsWith("image/")) {
                    return "image";
                } else if (contentType.startsWith("video/")) {
                    return "video";
                } else if (contentType.startsWith("audio/")) {
                    return "audio";
                }
            }
            throw new IllegalArgumentException("File name is invalid: " + fileName);
        }
        
        String extension = getFileExtension(fileName);

        if (extension != null) {
            switch (extension.toLowerCase()) {
                case ".jpg":
                case ".jpeg":
                case ".png":
                case ".gif":
                case ".webp":
                    return "image";
                case ".mp4":
                case ".avi":
                case ".mov":
                case ".wmv":
                case ".flv":
                case ".webm":
                    return "video";
                case ".mp3":
                case ".wav":
                case ".ogg":
                case ".m4a":
                case ".aac":
                    return "audio";
                default:
                    // Nếu extension không được hỗ trợ, thử xác định từ content type
                    String contentType = file.getContentType();
                    if (contentType != null) {
                        if (contentType.startsWith("image/")) {
                            return "image";
                        } else if (contentType.startsWith("video/")) {
                            return "video";
                        } else if (contentType.startsWith("audio/")) {
                            return "audio";
                        }
                    }
                    throw new IllegalArgumentException("Unsupported file type: " + extension);
            }
        }

        // Nếu không có extension, thử xác định từ content type
        String contentType = file.getContentType();
        if (contentType != null) {
            if (contentType.startsWith("image/")) {
                return "image";
            } else if (contentType.startsWith("video/")) {
                return "video";
            } else if (contentType.startsWith("audio/")) {
                return "audio";
            }
        }
        
        throw new IllegalArgumentException("File name is invalid: " + fileName);
    }

    private String getFileExtension(String fileName) {
        if (fileName != null && fileName.lastIndexOf('.') > 0) {
            return fileName.substring(fileName.lastIndexOf('.'));
        }
        return null;
    }


    @Transactional
    public PostResponse savePost(PostRequest postRequest, List<String> fileUrls, List<MultipartFile> files) {
        PostEntity postEntity = modelMapper.map(postRequest, PostEntity.class);
        UserEntity user = userRepository.findByUserId(postRequest.getUser())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Đảm bảo content không null - nếu null hoặc empty thì set thành empty string
        String content = postRequest.getContent();
        if (content == null || content.trim().isEmpty()) {
            postEntity.setContent("");
        } else {
            postEntity.setContent(content.trim());
        }

        postEntity.setUser(user);

        // Xử lý bài viết được chia sẻ (nếu có)
        if (postRequest.getSharedPostId() != null && !postRequest.getSharedPostId().trim().isEmpty()) {
            PostEntity sharedPost = postRepository.findById(postRequest.getSharedPostId()).orElse(null);
            if (sharedPost != null) {
                postEntity.setSharedPost(sharedPost);
                
                // Tự động lưu bản ghi vào bảng shares để hiển thị ở Tab Chia sẻ
                com.example.manager.models.ShareEntity share = new com.example.manager.models.ShareEntity();
                share.setUser(user);
                share.setPost(sharedPost);
                shareRepository.save(share);
            }
        }
        
        // Set privacy level - nếu không có thì dùng giá trị mặc định từ isPublicPost
        String privacyLevel;
        if (postRequest.getPrivacyLevel() != null && !postRequest.getPrivacyLevel().trim().isEmpty()) {
            privacyLevel = postRequest.getPrivacyLevel().toUpperCase();
            postEntity.setPrivacyLevel(privacyLevel);
        } else if (postRequest.getIsPublicPost() != null) {
            // Tương thích ngược: nếu có isPublicPost thì convert sang privacyLevel
            privacyLevel = postRequest.getIsPublicPost() ? "PUBLIC" : "PRIVATE";
            postEntity.setPrivacyLevel(privacyLevel);
        } else {
            privacyLevel = "PUBLIC"; // Mặc định
            postEntity.setPrivacyLevel(privacyLevel);
        }
        
        // Đảm bảo isPublicPost luôn được set dựa trên privacyLevel
        // PUBLIC = true, các trường hợp khác = false
        postEntity.setIsPublicPost("PUBLIC".equals(privacyLevel));
        
        // Đảm bảo isPublicComment luôn được set
        if (postEntity.getIsPublicComment() == null) {
            postEntity.setIsPublicComment(postRequest.getIsPublicComment() != null ? postRequest.getIsPublicComment() : true);
        }
        
        PostEntity newPost = postRepository.save(postEntity);

        // Lưu các phương tiện (nếu có)
        if (fileUrls != null && !fileUrls.isEmpty() && files != null && !files.isEmpty()) {
            // Đảm bảo fileUrls và files có cùng kích thước
            int minSize = Math.min(fileUrls.size(), files.size());
            for (int i = 0; i < minSize; i++) {
                String fileUrl = fileUrls.get(i);
                MultipartFile file = files.get(i);
                
                // Bỏ qua nếu file null hoặc empty
                if (file == null || file.isEmpty()) {
                    continue;
                }
                
                try {
                    String typeFile = determineFileType(file); // Lấy kiểu tệp từ danh sách files

                    MediaEntity mediaEntity = new MediaEntity();
                    mediaEntity.setPost(newPost);
                    mediaEntity.setUrl(fileUrl);
                    mediaEntity.setType(typeFile); // Gán giá trị type cho mediaEntity
                    mediaEntity.setDisplayOrder(i); // Lưu thứ tự: ảnh đầu tiên = 0, ảnh thứ hai = 1, ...
                    mediaRepository.save(mediaEntity);
                } catch (IllegalArgumentException e) {
                    // Log lỗi nhưng không throw để không làm gián đoạn việc lưu post
                    System.err.println("Error determining file type for file at index " + i + ": " + e.getMessage());
                    // Vẫn lưu media với type mặc định là "image"
                    MediaEntity mediaEntity = new MediaEntity();
                    mediaEntity.setPost(newPost);
                    mediaEntity.setUrl(fileUrl);
                    mediaEntity.setType("image"); // Type mặc định
                    mediaEntity.setDisplayOrder(i);
                    mediaRepository.save(mediaEntity);
                }
            }
        }

        ItemUserResponse itemUserResponse = modelMapper.map(user, ItemUserResponse.class);
        PostResponse postResponse = modelMapper.map(newPost, PostResponse.class);
        postResponse.setUser(itemUserResponse);
        postResponse.setMediaUrls(fileUrls != null ? fileUrls : new ArrayList<>());
        postResponse.setPrivacyLevel(newPost.getPrivacyLevel());
        if (newPost.getSharedPost() != null && postResponse.getSharedPost() != null) {
            postResponse.getSharedPost().setMediaUrls(setUrlMediaResponse(newPost.getSharedPost()));
        }

        // ================================================================
        // TÍCH HỢP HYBRID PUSH/PULL CACHE (CÓ TRY-CATCH FALLBACK)
        // ================================================================
        try {
            String authorId = user.getUserId();
            String postId = newPost.getPostId();
            long timestamp = newPost.getCreatedAt() != null ? newPost.getCreatedAt().getTime() : System.currentTimeMillis();

            // 1. Luôn đưa vào Outbox cá nhân
            feedCacheService.pushToOutbox(authorId, postId, timestamp);

            // 2. Kiểm tra ngưỡng Người nổi tiếng (Celebrity) và chỉ đẩy tin cho followers nếu bài đăng không phải PRIVATE
            String postPrivacy = newPost.getPrivacyLevel();
            if (postPrivacy == null || postPrivacy.isEmpty()) {
                postPrivacy = newPost.getIsPublicPost() != null && newPost.getIsPublicPost() ? "PUBLIC" : "PRIVATE";
            }
            if (!"PRIVATE".equalsIgnoreCase(postPrivacy)) {
                long followerCount = followRepository.countFollowersByUserId(authorId);
                if (followerCount < celebrityThreshold) {
                    // PUSH MODEL: Đẩy tin cho tất cả followers
                    List<String> followerIds = followRepository.findFollowerIdsByFollowingId(authorId);
                    for (String followerId : followerIds) {
                        feedCacheService.pushToFeed(followerId, postId, timestamp);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Redis sập hoặc gặp lỗi kết nối khi ghi cache. Đã fallback thành công, dữ liệu an toàn dưới DB. Lỗi: {}", e.getMessage());
        }

        // ── Gửi thông báo tag cho những người được nhắc đến ──
        try {
            String postContent = postEntity.getContent();
            if (postContent != null && !postContent.isEmpty()) {
                java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("@(\\S+)");
                java.util.regex.Matcher matcher = pattern.matcher(postContent);
                while (matcher.find()) {
                    String mentionedUsername = matcher.group(1);
                    userRepository.findByUsername(mentionedUsername).ifPresent(mentionedUser -> {
                        notificationService.notifyTag(
                            mentionedUser.getUserId(),
                            user.getUserId(),
                            user.getUsername(),
                            newPost.getPostId()
                        );
                    });
                }
            }
        } catch (Exception e) {
            log.warn("Lỗi gửi thông báo tag: {}", e.getMessage());
        }

        return postResponse;
    }



    @Transactional
    public Boolean deletePost(String postId) {
        PostEntity postEntity = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        // 1. Xóa các file trên MinIO
        List<MediaEntity> mediaEntities = mediaRepository.findByPostOrderByDisplayOrderAsc(postEntity);
        for (MediaEntity mediaEntity : mediaEntities) {
            String url = mediaEntity.getUrl();
            if (url != null && !url.isBlank()) {
                minioStorageService.deleteFile(url);
            }
        }

        // 2. Xóa các lượt thích của các bình luận thuộc bài viết này trước (để tránh lỗi khóa ngoại)
        likeRepository.deleteByCommentPostId(postId);

        // 3. Xóa các bình luận thủ công (vì CommentEntity không dùng PostEntity mapping)
        commentRepository.deleteByPostId(postId);

        // 4. Xóa PostEntity - JPA sẽ tự động Cascade xóa likes, shares, media, reports trong DB
        postRepository.delete(postEntity);
        return true;
    }


    // ----------------- Lấy tất cả bài viết (cho admin, bao gồm cả private) ------------------------//
    public Page<PostResponse> getAllPostsForAdmin(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<PostEntity> postsPage = postRepository.findAll(pageable);

        return postsPage.map(post -> {
            PostResponse response = modelMapper.map(post, PostResponse.class);

            // Fetch media từ repository thay vì dùng getMediaList() để tránh lazy loading issues
            List<String> mediaUrls = setUrlMediaResponse(post);

            response.setMediaUrls(mediaUrls != null ? mediaUrls : new ArrayList<>());
            response.setPrivacyLevel(post.getPrivacyLevel());
            response.setNumberLike(likeRepository.countLikePost(post.getPostId()));
            response.setNumberComment(commentRepository.countCommentByPost(post.getPostId()));
            response.setNumberShare(shareRepository.countShareByPostId(post.getPostId()));
            response.setLiked(false);

            return response;
        });
    }

    // Kiểm tra xem user có thể xem bài viết không dựa trên privacy level
    private boolean canUserViewPost(PostEntity post, String viewerUserId) {
        if (post == null || post.getUser() == null) {
            return false;
        }
        
        String postOwnerId = post.getUser().getUserId();
        
        // Chủ bài viết luôn có thể xem
        if (postOwnerId.equals(viewerUserId)) {
            return true;
        }
        
        String privacyLevel = post.getPrivacyLevel();
        if (privacyLevel == null || privacyLevel.isEmpty()) {
            privacyLevel = post.getIsPublicPost() != null && post.getIsPublicPost() ? "PUBLIC" : "PRIVATE";
        }
        
        switch (privacyLevel.toUpperCase()) {
            case "PUBLIC":
                return true;
            case "PRIVATE":
                return false;
            case "FRIENDS":
                return followRepository.isMutualFriend(viewerUserId, postOwnerId);
            case "FRIENDS_OF_FRIENDS":
                return followRepository.isMutualFriend(viewerUserId, postOwnerId) || 
                       followRepository.areFriendsOfFriends(viewerUserId, postOwnerId);
            default:
                return false;
        }
    }

    // ----------------- Lấy tất cả bài viết ------------------------//
    public Page<PostResponse> getAllPost(int page, int size, String currentUserId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // Trường hợp không đăng nhập: Fallback lấy bài viết công khai từ DB
        if (currentUserId == null || currentUserId.trim().isEmpty()) {
            return getFallbackPublicFeed(pageable, currentUserId);
        }

        // Tự động làm ấm và đồng bộ lại cache ở trang đầu tiên (đặc biệt khi Redis bị restart/trống)
        if (page == 0) {
            rebuildFeedCache(currentUserId);
        }

        try {
            // 1. Đọc tin từ Feed Cache cá nhân (Bài viết của bạn bè thường)
            List<String> normalPostIds = feedCacheService.getFeedPostIds(currentUserId, 0, 199);
            List<FeedCacheService.PostIdWithScore> allFeeds = new ArrayList<>();
            
            if (!normalPostIds.isEmpty()) {
                List<PostEntity> posts = postRepository.findAllById(normalPostIds);
                for (PostEntity post : posts) {
                    allFeeds.add(new FeedCacheService.PostIdWithScore(post.getPostId(), post.getCreatedAt().getTime()));
                }
            }

            // 2. PULL MODEL: Chủ động kéo thêm bài từ các Celebrity mà User đang follow
            List<String> followingIds = followRepository.findFollowingIdsByFollowerId(currentUserId);
            for (String targetUserId : followingIds) {
                long followerCountOfTarget = followRepository.countFollowersByUserId(targetUserId);
                if (followerCountOfTarget >= celebrityThreshold) {
                    List<FeedCacheService.PostIdWithScore> celebrityPosts = feedCacheService.getOutboxPostIdsWithScores(targetUserId, 20);
                    allFeeds.addAll(celebrityPosts);
                }
            }

            // 3. Trộn và sắp xếp theo thời gian
            Map<String, FeedCacheService.PostIdWithScore> uniqueFeedsMap = allFeeds.stream()
                    .collect(Collectors.toMap(
                            FeedCacheService.PostIdWithScore::getPostId,
                            Function.identity(),
                            (existing, replacement) -> existing
                    ));
            
            List<FeedCacheService.PostIdWithScore> sortedFeedList = new ArrayList<>(uniqueFeedsMap.values());
            Collections.sort(sortedFeedList);

            if (sortedFeedList.isEmpty()) {
                return getFallbackNewsFeed(pageable, currentUserId);
            }

            // 4. Thực hiện phân trang trong bộ nhớ
            int totalElements = sortedFeedList.size();
            int fromIndex = page * size;
            int toIndex = Math.min(fromIndex + size, totalElements);
            
            if (fromIndex >= totalElements) {
                return new PageImpl<>(Collections.emptyList(), pageable, totalElements);
            }

            List<FeedCacheService.PostIdWithScore> pageSubList = sortedFeedList.subList(fromIndex, toIndex);
            List<String> pagePostIds = pageSubList.stream()
                    .map(FeedCacheService.PostIdWithScore::getPostId)
                    .collect(Collectors.toList());

            // 5. Hydrate dữ liệu chi tiết từ DB theo đúng thứ tự sắp xếp ban đầu
            List<PostEntity> postEntities = postRepository.findAllById(pagePostIds);
            Map<String, PostEntity> entityMap = postEntities.stream()
                    .collect(Collectors.toMap(PostEntity::getPostId, Function.identity()));
            
            List<PostEntity> sortedEntities = pagePostIds.stream()
                    .map(entityMap::get)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            List<PostResponse> responses = mapEntitiesToResponses(sortedEntities, currentUserId, pageable);
            return new PageImpl<>(responses, pageable, totalElements);

        } catch (Exception e) {
            // FALLBACK KHI REDIS SẬP: Quay về đọc trực tiếp từ MySQL
            log.error("Redis gặp sự cố khi đọc feed. Kích hoạt Fallback tự động sang MySQL. Lỗi: {}", e.getMessage());
            return getFallbackNewsFeed(pageable, currentUserId);
        }
    }

    public Page<PostResponse> searchPosts(String keyword, int page, int size, String currentUserId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<PostEntity> postsPage = postRepository.searchByContent(keyword, pageable);
        List<PostResponse> responses = mapEntitiesToResponses(postsPage.getContent(), currentUserId, pageable);
        return new PageImpl<>(responses, pageable, postsPage.getTotalElements());
    }

    private Page<PostResponse> getFallbackPublicFeed(Pageable pageable, String currentUserId) {
        Page<PostEntity> postsEntityPage = postRepository.findAllPublicPostsPaged(pageable);
        List<PostResponse> responses = mapEntitiesToResponses(postsEntityPage.getContent(), currentUserId, pageable);
        return new PageImpl<>(responses, pageable, postsEntityPage.getTotalElements());
    }

    private Page<PostResponse> getFallbackNewsFeed(Pageable pageable, String currentUserId) {
        if (currentUserId == null || currentUserId.trim().isEmpty()) {
            return getFallbackPublicFeed(pageable, currentUserId);
        }
        Page<PostEntity> postsEntityPage = postRepository.findNewsFeedFallback(currentUserId, pageable);
        List<PostResponse> responses = mapEntitiesToResponses(postsEntityPage.getContent(), currentUserId, pageable);
        return new PageImpl<>(responses, pageable, postsEntityPage.getTotalElements());
    }

    private void rebuildFeedCache(String userId) {
        try {
            // Kéo 100 bài viết mới nhất từ MySQL của chính user và những người đang follow
            Pageable limitPage = PageRequest.of(0, 100, Sort.by("createdAt").descending());
            Page<PostEntity> followPosts = postRepository.findNewsFeedFallback(userId, limitPage);
            
            if (followPosts != null && followPosts.hasContent()) {
                for (PostEntity post : followPosts.getContent()) {
                    long timestamp = post.getCreatedAt() != null ? post.getCreatedAt().getTime() : System.currentTimeMillis();
                    // pushToFeed đẩy vào Redis, tự chèn thêm nếu thiếu hoặc skip nếu đã có
                    feedCacheService.pushToFeed(userId, post.getPostId(), timestamp);
                }
            }
        } catch (Exception e) {
            log.warn("Không thể tự động rebuild Feed Cache cho user {}. Lỗi: {}", userId, e.getMessage());
        }
    }


    private Map<String, Integer> convertToCountMap(List<Object[]> results) {
        Map<String, Integer> countMap = new HashMap<>();
        for (Object[] result : results) {
            countMap.put((String) result[0], ((Long) result[1]).intValue());
        }
        return countMap;
    }


    // ----------- Get PostEntity ------------
    public PostEntity getItemPostEntity(String postId){
        return postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
    }



    // ----------- GET ITEM POST RESPONSE  -------------
    public PostResponse getItemPost(String postId){
        return getItemPost(postId, null);
    }

    public PostResponse getItemPost(String postId, String currentUserId){
        PostEntity postEntity = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        List<String> mediaUrls = setUrlMediaResponse(postEntity);
        PostResponse postResponse = modelMapper.map(postEntity,PostResponse.class);
        int countLike = likeRepository.countLikePost(postId);
        int countComment = commentRepository.countCommentByPost(postId);
        int countShare = shareRepository.countShareByPostId(postId);
        postResponse.setMediaUrls(mediaUrls != null ? mediaUrls : new ArrayList<>());
        postResponse.setPrivacyLevel(postEntity.getPrivacyLevel());
        postResponse.setNumberLike(countLike);
        postResponse.setNumberComment(countComment);
        postResponse.setNumberShare(countShare);

        if (currentUserId != null && !currentUserId.isEmpty()) {
            List<com.example.manager.models.LikeEntity> userLikes = likeRepository.findByUserAndPost(postId, currentUserId);
            postResponse.setLiked(userLikes != null && !userLikes.isEmpty());
            postResponse.setIsSaved(savedPostRepository.existsByUserAndPost(userRepository.findById(currentUserId).orElse(null), postEntity));
        } else {
            postResponse.setLiked(false);
            postResponse.setIsSaved(false);
        }

        if(postEntity.getIsPublicComment().equals(Boolean.FALSE)){
            postResponse.setNumberComment(0);
        }

        return postResponse;
    }


    // -------------- SET URL FOR POST RESPONSE -------------
    private List<String> setUrlMediaResponse(PostEntity post){
        // Sử dụng method mới có sắp xếp theo displayOrder
        List<MediaEntity> mediaEntities = mediaRepository.findByPostOrderByDisplayOrderAsc(post);
        return mediaEntities.stream()
                .map(media -> {
                    String url = media.getUrl();
                    if (url == null || url.trim().isEmpty()) {
                        return null;
                    }
                    // Nếu là URL tuyệt đối từ MinIO (http://... hoặc https://...) thì chuyển thành tương đối
                    if (url.startsWith("http://") || url.startsWith("https://")) {
                        if (url.contains("/casa/")) {
                            int casaIdx = url.indexOf("/casa/");
                            return url.substring(casaIdx);
                        }
                        return url;
                    }
                    // Nếu là URL local fallback bắt đầu bằng /uploads/ thì giữ nguyên
                    if (url.startsWith("/uploads/") || url.startsWith("uploads/")) {
                        return url.startsWith("/") ? url : "/" + url;
                    }
                    // Nếu URL đã có prefix (/images/, /videos/, /audios/) thì giữ nguyên
                    if (url.startsWith("/images/") || url.startsWith("/videos/") || url.startsWith("/audios/")) {
                        return url;
                    }
                    // Nếu URL chưa có prefix, thêm prefix dựa trên type
                    String type = media.getType() != null ? media.getType().toLowerCase() : "image";
                    String prefix = "/" + type + "s/";
                    // Kiểm tra xem URL có bắt đầu bằng prefix không (trường hợp đã có prefix nhưng không có dấu / đầu)
                    if (url.startsWith(prefix.substring(1))) {
                        return "/" + url;
                    }
                    return prefix + url;
                })
                .filter(url -> url != null && !url.trim().isEmpty())
                .collect(Collectors.toList());
    }

    // Public method để lấy mediaUrls cho report
    public List<String> getMediaUrlsForPost(PostEntity post){
        return setUrlMediaResponse(post);
    }


    // -------------- GET ALL POST BY USER ID ------------
    public Page<PostResponse> getAllPostByUserId(String userId, int page, int size, String currentUserId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<PostEntity> postsEntityPage = postRepository.findAllByUserId(userId, pageable);

        List<PostEntity> posts = postsEntityPage.getContent();
        // Filter theo privacy level nếu người xem không phải chủ bài viết (bao gồm cả khách chưa đăng nhập)
        if (currentUserId == null || !currentUserId.equals(userId)) {
            posts = posts.stream()
                    .filter(post -> canUserViewPost(post, currentUserId))
                    .collect(Collectors.toList());
        }

        List<PostResponse> responses = mapEntitiesToResponses(posts, currentUserId, pageable);
        return new PageImpl<>(responses, pageable, postsEntityPage.getTotalElements());
    }

    private List<PostResponse> mapEntitiesToResponses(List<PostEntity> posts, String currentUserId, Pageable pageable) {
        if (posts.isEmpty()) return new ArrayList<>();

        List<String> postIds = posts.stream().map(PostEntity::getPostId).collect(Collectors.toList());
        
        // Bulk fetch counts
        Map<String, Integer> likeCounts = convertToCountMap(likeRepository.countLikesByPostIds(postIds));
        Map<String, Integer> commentCounts = convertToCountMap(commentRepository.countCommentsByPostIds(postIds));
        
        Map<String, Integer> shareCounts = convertToCountMap(shareRepository.countSharesByPostIds(postIds));
        
        // Bulk fetch liked status
        Set<String> likedPostIds = new HashSet<>();
        Set<String> savedPostIds = new HashSet<>();
        if (currentUserId != null && !currentUserId.isEmpty()) {
            likedPostIds.addAll(likeRepository.findLikedPostIds(currentUserId, postIds));
            savedPostIds.addAll(savedPostRepository.findSavedPostIds(currentUserId, postIds));
        }

        return posts.stream().map(post -> {
            PostResponse res = modelMapper.map(post, PostResponse.class);
            res.setMediaUrls(setUrlMediaResponse(post));
            res.setPrivacyLevel(post.getPrivacyLevel());
            res.setNumberLike(likeCounts.getOrDefault(post.getPostId(), 0));
            res.setNumberComment(commentCounts.getOrDefault(post.getPostId(), 0));
            res.setNumberShare(shareCounts.getOrDefault(post.getPostId(), 0));
            res.setLiked(likedPostIds.contains(post.getPostId()));
            res.setIsSaved(savedPostIds.contains(post.getPostId()));
            
            if (post.getSharedPost() != null && res.getSharedPost() != null) {
                res.getSharedPost().setMediaUrls(setUrlMediaResponse(post.getSharedPost()));
            }
            
            if (post.getIsPublicComment().equals(Boolean.FALSE)) {
                res.setNumberComment(0);
            }
            
            return res;
        }).collect(Collectors.toList());
    }

    // -------------- GET ALL PRIVATE POST BY USER ID ------------
    public Page<PostResponse> getAllPrivatePostByUserId(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PostEntity> postsEntityPage = postRepository.findAllPrivatePostByUserId(userId, pageable);

        return postsEntityPage.map(post -> getItemPost(post.getPostId()));
    }


    // -------------- GET ALL LIKE BY POST ID ------------
    public List<LikeItemResponse> getAllLikeByPost(String postId){
        List<LikeEntity> likeEntities = likeRepository.getAllLikeByPost(postId);
        return likeEntities.stream()
                .map(like -> getItemLikeByPost(like))
                .collect(Collectors.toList());
    }


    // -------------- CONVERT LIKE RESPONSE ------------
    public LikeItemResponse getItemLikeByPost(LikeEntity likeEntity){
        return modelMapper.map(likeEntity,LikeItemResponse.class);
    }


    // ------------- SET PUBLIC POST --------------
    public Boolean setPublicPost(String postId) {
        // Kiểm tra xem postId có tồn tại không
        Optional<PostEntity> optionalPost = postRepository.findById(postId);
        if (optionalPost.isPresent()) {
            PostEntity post = optionalPost.get();
            post.setIsPublicPost(true);
            postRepository.save(post);
            return true;
        }
        return false;
    }

    public Boolean setPrivatePost(String postId) {
        // Kiểm tra xem postId có tồn tại không
        Optional<PostEntity> optionalPost = postRepository.findById(postId);
        if (optionalPost.isPresent()) {
            PostEntity post = optionalPost.get();
            post.setIsPublicPost(false);
            postRepository.save(post);
            return true;
        }
        return false;
    }

    public Boolean setPublicComment(String postId) {
        // Kiểm tra xem postId có tồn tại không
        Optional<PostEntity> optionalPost = postRepository.findById(postId);
        if (optionalPost.isPresent()) {
            PostEntity post = optionalPost.get();
            post.setIsPublicComment(true);
            postRepository.save(post);
            return true;
        }
        return false;
    }

    public Boolean setPrivateComment(String postId) {
        // Kiểm tra xem postId có tồn tại không
        Optional<PostEntity> optionalPost = postRepository.findById(postId);
        if (optionalPost.isPresent()) {
            PostEntity post = optionalPost.get();
            post.setIsPublicComment(false);
            postRepository.save(post);
            return true;
        }
        return false;
    }

    @Transactional
    public Boolean updatePost(UpdatePostRequest updatePost, String postId){
        Optional<PostEntity> optionalPost = postRepository.findById(postId);
        if (optionalPost.isPresent()) {
            PostEntity post = optionalPost.get();
            
            // Cập nhật các trường nếu có
            if (updatePost.getIsPublicPost() != null) {
                post.setIsPublicPost(updatePost.getIsPublicPost());
            }
            if (updatePost.getPrivacyLevel() != null && !updatePost.getPrivacyLevel().trim().isEmpty()) {
                post.setPrivacyLevel(updatePost.getPrivacyLevel().toUpperCase());
            } else if (updatePost.getIsPublicPost() != null) {
                // Tương thích ngược
                post.setPrivacyLevel(updatePost.getIsPublicPost() ? "PUBLIC" : "PRIVATE");
            }
            if (updatePost.getIsPublicComment() != null) {
                post.setIsPublicComment(updatePost.getIsPublicComment());
            }
            if (updatePost.getContent() != null) {
                post.setContent(updatePost.getContent().trim());
            }
            
            post.setUpdatedAt(new Timestamp(System.currentTimeMillis()));
            postRepository.save(post);
            return true;
        }
        return false;
    }

    @Transactional
    public PostResponse updatePostWithFiles(UpdatePostRequest updatePost, String postId, List<MultipartFile> newFiles, List<String> keepMediaUrls) {
        Optional<PostEntity> optionalPost = postRepository.findById(postId);
        if (!optionalPost.isPresent()) {
            throw new RuntimeException("Post not found");
        }

        PostEntity post = optionalPost.get();

        // Cập nhật content và settings
        if (updatePost.getContent() != null) {
            post.setContent(updatePost.getContent().trim());
        }
        if (updatePost.getIsPublicPost() != null) {
            post.setIsPublicPost(updatePost.getIsPublicPost());
        }
        if (updatePost.getIsPublicComment() != null) {
            post.setIsPublicComment(updatePost.getIsPublicComment());
        }
        post.setUpdatedAt(new Timestamp(System.currentTimeMillis()));

        // Xử lý media: xóa các media không được giữ lại
        List<MediaEntity> existingMedia = mediaRepository.findByPostOrderByDisplayOrderAsc(post);
        List<String> keepUrls = keepMediaUrls != null ? keepMediaUrls : new ArrayList<>();

        for (MediaEntity media : existingMedia) {
            String mediaUrl = media.getUrl();
            // So sánh trực tiếp full URL (MinIO URL)
            if (!keepUrls.contains(mediaUrl)) {
                // Xóa file trên MinIO
                minioStorageService.deleteFile(mediaUrl);
                // Xóa media record từ database
                mediaRepository.delete(media);
            }
        }

        // Thêm các file mới
        int startOrder = keepUrls.size();
        if (newFiles != null && !newFiles.isEmpty()) {
            for (int i = 0; i < newFiles.size(); i++) {
                MultipartFile file = newFiles.get(i);
                if (file != null && !file.isEmpty()) {
                    String typeFile = determineFileType(file);
                    // Upload file mới lên MinIO
                    String fileUrl = minioStorageService.uploadFile(file, typeFile + "s");

                    MediaEntity mediaEntity = new MediaEntity();
                    mediaEntity.setPost(post);
                    mediaEntity.setUrl(fileUrl);
                    mediaEntity.setType(typeFile);
                    mediaEntity.setDisplayOrder(startOrder + i);
                    mediaRepository.save(mediaEntity);
                }
            }
        }
        
        postRepository.save(post);
        
        // Trả về PostResponse đã cập nhật
        return getItemPost(postId);
    }

    @Transactional
    public Boolean toggleSavePost(String postId, String userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Optional<SavedPostEntity> optionalSavedPost = savedPostRepository.findByUserAndPost(user, post);
        if (optionalSavedPost.isPresent()) {
            savedPostRepository.delete(optionalSavedPost.get());
            return false;
        } else {
            SavedPostEntity savedPost = new SavedPostEntity();
            savedPost.setUser(user);
            savedPost.setPost(post);
            savedPostRepository.save(savedPost);
            return true;
        }
    }

    public Page<PostResponse> getSavedPosts(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<SavedPostEntity> savedPostsPage = savedPostRepository.findByUserId(userId, pageable);

        List<PostEntity> posts = savedPostsPage.getContent().stream()
                .map(SavedPostEntity::getPost)
                .collect(Collectors.toList());

        List<PostResponse> responses = mapEntitiesToResponses(posts, userId, pageable);
        return new PageImpl<>(responses, pageable, savedPostsPage.getTotalElements());
    }

}
