package com.example.manager.controllers;

import com.example.manager.dto.requests.PostReport.PostDTO;
import com.example.manager.dto.requests.PostReport.PostReportDTO;
import com.example.manager.dto.requests.PostReport.UserDTO;
import com.example.manager.dto.requests.post.HandleReportRequest;
import com.example.manager.dto.requests.post.PostRequest;
import com.example.manager.dto.requests.post.ReportPostRequest;
import com.example.manager.dto.requests.post.UpdatePostRequest;
import com.example.manager.dto.responses.common.ApiResponse;
import com.example.manager.dto.responses.like.LikeItemResponse;
import com.example.manager.dto.responses.post.PostResponse;
import com.example.manager.models.PostEntity;
import com.example.manager.models.PostReportEntity;
import com.example.manager.models.UserEntity;
import com.example.manager.repositories.PostReportRepository;
import com.example.manager.repositories.PostRepository;
import com.example.manager.repositories.UserRepository;
import com.example.manager.services.PostService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.sql.Timestamp;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/post")
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private PostRepository postRepository;

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

    @Autowired
    private PostReportRepository postReportRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFiles(
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @RequestPart(value = "post", required = true) String postJson
    ) {
        try {
            PostRequest post = objectMapper.readValue(postJson, PostRequest.class);
            // Kiểm tra và xử lý files
            boolean hasFiles = false;
            List<MultipartFile> validFiles = null;
            if (files != null) {
                // Loại bỏ các file null hoặc empty
                validFiles = files.stream()
                        .filter(file -> file != null && !file.isEmpty())
                        .collect(Collectors.toList());
                hasFiles = !validFiles.isEmpty();
            }
            
            // Kiểm tra content
            String content = post.getContent();
            boolean hasContent = content != null && !content.trim().isEmpty();
            
            // Phải có ít nhất một trong ba: files, content hoặc sharedPostId
            boolean hasSharedPost = post.getSharedPostId() != null && !post.getSharedPostId().trim().isEmpty();
            if (!hasFiles && !hasContent && !hasSharedPost) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(400, "Post must have either content, images or sharedPostId", null));
            }

            PostResponse postResponse;
            if (hasFiles && validFiles != null) {
                postResponse = postService.savePostWithFiles(post, validFiles);
            } else {
                // Chỉ có nội dung, không có file
                postResponse = postService.savePostWithoutFiles(post);
            }
            ApiResponse<PostResponse> response = new ApiResponse<>(201, "Create success", postResponse);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ApiResponse<>(400, e.getMessage(), null));
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new ApiResponse<>(500, "Error: " + e.getMessage(), null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new ApiResponse<>(500, "Internal server error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllPost(
            @RequestParam(defaultValue = "1") int page, 
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        System.out.println("DEBUG: Fetching global feed");
        String currentUserId = getCurrentUserId(authentication);
        Page<PostResponse> postResponses = postService.getAllPost(page - 1, size, currentUserId);
        return ResponseEntity.ok(new ApiResponse<>(200, "Fetch success", postResponses));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getAllPostByUserId(
            @PathVariable("userId") String userId,
            @RequestParam(defaultValue = "1") int page, 
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        System.out.println("DEBUG: Fetching posts for specific user: " + userId);
        String currentUserId = getCurrentUserId(authentication);
        Page<PostResponse> postResponses = postService.getAllPostByUserId(userId, page - 1, size, currentUserId);
        return ResponseEntity.ok(new ApiResponse<>(200, "Fetch success", postResponses));
    }

    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllPostsForAdmin(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        Page<PostResponse> postResponses = postService.getAllPostsForAdmin(page, size);
        return ResponseEntity.ok(new ApiResponse<>(200, "Fetch success", postResponses));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<?> deletePost(@PathVariable("postId") String postId) {
        try {
            Boolean isSuccess = postService.deletePost(postId);
            if (isSuccess) {
                return ResponseEntity.ok(new ApiResponse<>(200, "Delete success", true));
            } else {
                return ResponseEntity.status(404).body(new ApiResponse<>(404, "Post not found", false));
            }
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(new ApiResponse<>(404, e.getMessage(), false));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(500, "Failed to delete post", null));
        }
    }

    @GetMapping("/item/{postId}")
    public ResponseEntity<?> getItemPost(@PathVariable("postId") String postId, Authentication authentication){
        String currentUserId = getCurrentUserId(authentication);
        PostResponse postResponses = postService.getItemPost(postId, currentUserId);
        return ResponseEntity.ok(new ApiResponse<>(200, "Fetch success", postResponses));
    }

    @GetMapping("/like-all/{postId}")
    public ResponseEntity<?> getAllLike(@PathVariable("postId") String postId){
        List<LikeItemResponse> likeItemResponses = postService.getAllLikeByPost(postId);
        return ResponseEntity.ok(new ApiResponse<>(200, "Fetch success", likeItemResponses));
    }

    @PutMapping("/update/{postId}")
    public ResponseEntity<?> updatePost(@RequestBody UpdatePostRequest updatePost,@PathVariable("postId") String postId) {
        Boolean isSuccess = postService.updatePost(updatePost,postId);
        return ResponseEntity.ok(new ApiResponse<>(200, "Update success", isSuccess));
    }

    @PutMapping("/update/{postId}/with-files")
    public ResponseEntity<?> updatePostWithFiles(
            @PathVariable("postId") String postId,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @RequestPart(value = "keepMediaUrls", required = false) String keepMediaUrlsJson,
            @RequestPart(value = "post", required = true) String postJson
    ) {
        try {
            UpdatePostRequest updatePost = objectMapper.readValue(postJson, UpdatePostRequest.class);
            List<String> keepMediaUrls = null;
            if (keepMediaUrlsJson != null && !keepMediaUrlsJson.trim().isEmpty()) {
                String[] keepMediaUrlsArray = objectMapper.readValue(keepMediaUrlsJson, String[].class);
                if (keepMediaUrlsArray != null && keepMediaUrlsArray.length > 0) {
                    keepMediaUrls = Arrays.asList(keepMediaUrlsArray);
                }
            }

            List<MultipartFile> validFiles = null;
            if (files != null) {
                validFiles = files.stream()
                        .filter(file -> file != null && !file.isEmpty())
                        .collect(Collectors.toList());
            }
            
            PostResponse postResponse = postService.updatePostWithFiles(
                    updatePost, 
                    postId, 
                    validFiles != null && !validFiles.isEmpty() ? validFiles : null,
                    keepMediaUrls
            );
            
            return ResponseEntity.ok(new ApiResponse<>(200, "Update success", postResponse));
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ApiResponse<>(400, e.getMessage(), null));
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.status(404).body(new ApiResponse<>(404, e.getMessage(), null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new ApiResponse<>(500, "Internal server error: " + e.getMessage(), null));
        }
    }

    @PutMapping("/set-public/{postId}")
    public ResponseEntity<?> setPublicPost(@PathVariable("postId") String postId) {
        Boolean isSuccess = postService.setPublicPost(postId);
        return ResponseEntity.ok(new ApiResponse<>(200, "Update success", isSuccess));
    }

    @PutMapping("/set-private/{postId}")
    public ResponseEntity<?> setPrivatePost(@PathVariable("postId") String postId) {
        Boolean isSuccess = postService.setPrivatePost(postId);
        return ResponseEntity.ok(new ApiResponse<>(200, "Update success", isSuccess));
    }



    @PostMapping("/{postId}/report")
    public ResponseEntity<ApiResponse<?>> reportPost(
            @PathVariable("postId") String postId,
            @RequestBody ReportPostRequest request
    ) {
        try {
            // Kiểm tra bài viết tồn tại
            PostEntity post = postRepository.findById(postId)
                    .orElseThrow(() -> new RuntimeException("Post not found"));

            // Kiểm tra người dùng tồn tại
            UserEntity user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Kiểm tra người dùng đã báo cáo bài viết này chưa
            if (postReportRepository.existsByPostAndReporter(post, user)) {
                throw new RuntimeException("You have already reported this post");
            }

            // Tạo báo cáo mới
            PostReportEntity report = new PostReportEntity();
            report.setPost(post);
            report.setReporter(user);
            report.setReason(request.getReason());
            report.setDescription(request.getDescription());

            postReportRepository.save(report);

            ApiResponse<?> apiResponse =
                    new ApiResponse<>(201, "Report submitted successfully", null);
            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            ApiResponse<?> apiResponse =
                    new ApiResponse<>(400, e.getMessage(), null);
            return ResponseEntity.badRequest().body(apiResponse);
        }
    }

    // API để admin xem danh sách báo cáo
    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<?>> getPostReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status
    ) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<PostReportEntity> reports;
            if (status != null) {
                reports = postReportRepository.findReportsByStatus(status, pageable);
            } else {
                reports = postReportRepository.findAll(pageable);
            }

            // Chuyển đổi sang DTO
            Page<PostReportDTO> reportDTOs = reports.map(report -> {
                PostReportDTO dto = new PostReportDTO();
                dto.setReportId(report.getReportId());
                dto.setPost(convertPostToDTO(report.getPost()));
                dto.setReporter(convertUserToDTO(report.getReporter()));
                dto.setReason(report.getReason());
                dto.setDescription(report.getDescription());
                dto.setStatus(report.getStatus());
                dto.setCreatedAt(report.getCreatedAt().toString());
                return dto;
            });

            ApiResponse<Page<PostReportDTO>> apiResponse =
                    new ApiResponse<>(200, "success", reportDTOs);
            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            ApiResponse<?> apiResponse =
                    new ApiResponse<>(400, e.getMessage(), null);
            return ResponseEntity.badRequest().body(apiResponse);
        }
    }

    // API để admin xử lý báo cáo
    @PutMapping("/reports/{reportId}/handle")
    public ResponseEntity<ApiResponse<?>> handleReport(
            @PathVariable("reportId") String reportId,
            @RequestBody HandleReportRequest request
    ) {
        try {
            PostReportEntity report = postReportRepository.findById(reportId)
                    .orElseThrow(() -> new RuntimeException("Report not found"));

            report.setStatus(request.getStatus());
            report.setUpdatedAt(new Timestamp(System.currentTimeMillis()));

            // Nếu báo cáo được chấp nhận, có thể thêm logic xử lý bài viết
            if ("APPROVED".equals(request.getStatus())) {
                // Ví dụ: ẩn bài viết
                report.getPost().setIsPublicPost(false);
                postRepository.save(report.getPost());
            }

            postReportRepository.save(report);

            ApiResponse<?> apiResponse =
                    new ApiResponse<>(200, "Report handled successfully", null);
            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            ApiResponse<?> apiResponse =
                    new ApiResponse<>(400, e.getMessage(), null);
            return ResponseEntity.badRequest().body(apiResponse);
        }
    }

    @PostMapping("/{postId}/save")
    public ResponseEntity<?> toggleSavePost(@PathVariable("postId") String postId, Authentication authentication) {
        String currentUserId = getCurrentUserId(authentication);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(new ApiResponse<>(401, "Unauthorized", null));
        }
        try {
            Boolean isSaved = postService.toggleSavePost(postId, currentUserId);
            String message = isSaved ? "Đã lưu bài viết thành công" : "Đã hủy lưu bài viết thành công";
            return ResponseEntity.ok(new ApiResponse<>(200, message, isSaved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(400, e.getMessage(), null));
        }
    }

    @GetMapping("/saved")
    public ResponseEntity<?> getSavedPosts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        String currentUserId = getCurrentUserId(authentication);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(new ApiResponse<>(401, "Unauthorized", null));
        }
        try {
            Page<PostResponse> savedPosts = postService.getSavedPosts(currentUserId, page - 1, size);
            return ResponseEntity.ok(new ApiResponse<>(200, "Fetch success", savedPosts));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(400, e.getMessage(), null));
        }
    }


    private PostDTO convertPostToDTO(PostEntity entity) {
        PostDTO dto = new PostDTO();
        dto.setPostId(entity.getPostId());
        dto.setContent(entity.getContent());
        dto.setUser(convertUserToDTO(entity.getUser()));
        dto.setCreatedAt(entity.getCreatedAt().toString());
        dto.setUpdatedAt(entity.getUpdatedAt().toString());
        dto.setIsPublicPost(entity.getIsPublicPost());
        dto.setIsPublicComment(entity.getIsPublicComment());
        
        // Thêm mediaUrls
        List<String> mediaUrls = postService.getMediaUrlsForPost(entity);
        dto.setMediaUrls(mediaUrls);
        
        return dto;
    }

    // Phương thức chuyển đổi UserEntity sang UserDTO
    private UserDTO convertUserToDTO(UserEntity entity) {
        UserDTO dto = new UserDTO();
        dto.setUserId(entity.getUserId());
        dto.setUsername(entity.getUsername());
        dto.setProfilePicture(entity.getProfilePicture());
        return dto;
    }
}
