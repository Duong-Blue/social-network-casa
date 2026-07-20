package com.example.manager.services;

import com.example.manager.dto.requests.user.ChangeName;
import com.example.manager.dto.requests.user.UpdateProfileRequest;
import com.example.manager.dto.requests.user.UserRequest;
import com.example.manager.dto.responses.role.RoleResponse;
import com.example.manager.dto.responses.user.ItemUserResponse;
import com.example.manager.dto.responses.user.ProfileUserResponse;
import com.example.manager.dto.responses.user.UserFriend;
import com.example.manager.dto.responses.user.UserRoleResponse;
import com.example.manager.models.RoleEntity;
import com.example.manager.models.UserEntity;
import com.example.manager.models.UserRoleEntity;
import com.example.manager.repositories.MediaRepository;
import com.example.manager.repositories.RoleRepository;
import com.example.manager.repositories.UserRepository;
import com.example.manager.repositories.UserRoleRepository;
import com.example.manager.repositories.FollowRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserService {
    @Autowired
    private UserRepository usersRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private MediaRepository mediaRepository;

    @Autowired
    private FollowRepository followRepository;

    @Autowired
    private MinioStorageService minioStorageService;


    public Page<UserFriend> getUsers(String name, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserEntity> usersPage = usersRepository.searchByName(name, pageable);
        return usersPage.map(user -> modelMapper.map(user, UserFriend.class));
    }


    public ProfileUserResponse profile (String userId){
        UserEntity user = usersRepository.profileUser(userId);
        Integer numberPost = Math.toIntExact(usersRepository.countUserPosts(userId));

        ProfileUserResponse response =  modelMapper.map(user,ProfileUserResponse.class);
        response.setNumberPost(numberPost);
        
        // ── Dùng COUNT SQL query, không load lazy collection (tránh N+1) ──
        response.setNumberFollower((int) followRepository.countFollowersByUserId(userId));
        response.setNumberFollowing((int) followRepository.countFollowingByUserId(userId));

        // Đảm bảo isLocked được map đúng (ModelMapper có thể không map nếu field name khác)
        if (user.getIsLocked() != null) {
            response.setIsLocked(user.getIsLocked());
        } else {
            response.setIsLocked(false);
        }
        return response;
    };

    // Đăng ký user mới
    public void registerUser(UserRequest userRequest) {
        if (usersRepository.existsByEmail(userRequest.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        UserEntity user = modelMapper.map(userRequest, UserEntity.class);
        user.setPassword(passwordEncoder.encode(user.getPassword())); // Mã hóa mật khẩu

        // Đặt ảnh đại diện mặc định nếu chưa có
        if (user.getProfilePicture() == null || user.getProfilePicture().isEmpty()) {
            // Dùng URL avatar mặc định từ MinIO (tự động seed khi service khởi động)
            user.setProfilePicture(minioStorageService.getDefaultAvatarUrl());
        }

        UserEntity newUser = usersRepository.save(user);

        // Tự động tạo role "USER" nếu chưa tồn tại
        RoleEntity roleUser = roleRepository.findByRoleName("USER")
                .orElseGet(() -> {
                    RoleEntity newRole = new RoleEntity();
                    newRole.setRoleName("USER");
                    newRole.setDescription("Default user role");
                    return roleRepository.save(newRole);
                });

        UserRoleEntity userRole = new UserRoleEntity();
        userRole.setRole(roleUser);
        userRole.setUser(newUser);

        userRoleRepository.save(userRole);
    }

    // Lấy danh sách UserRoleResponse
    public List<UserRoleResponse> getAllUserRoles() {
        return usersRepository.findAll()
                .stream()
                .map(this::convertToUserRoleResponse)
                .collect(Collectors.toList());
    }

    // Thay đổi tên người dùng
    public UserRoleResponse changeName(String userId, ChangeName name) {
        UserEntity user = usersRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        user.setUsername(name.getUsername());
        usersRepository.save(user);

        UserRoleResponse userRoleResponse = this.convertToUserRoleResponse(user);
        userRoleResponse.setUserId(user.getUserId());

        return userRoleResponse;
    }

    // Tìm UserEntity theo ID
    public UserEntity getUserById(String userId) {
        return usersRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
    }

    // Tìm UserEntity theo ID (phản hồi dạng DTO)
    public ItemUserResponse getUserByIdResponse(String userId) {
        UserEntity userEntity = getUserById(userId);
        return modelMapper.map(userEntity, ItemUserResponse.class);
    }

    // Chuyển đổi UserEntity thành UserRoleResponse
    private UserRoleResponse convertToUserRoleResponse(UserEntity user) {
        UserRoleResponse response = new UserRoleResponse();
        response.setUsername(user.getUsername());

        List<RoleResponse> roleResponses = user.getUserRoles().stream()
                .map(userRole -> {
                    RoleResponse roleResponse = new RoleResponse();
                    roleResponse.setRoleId(userRole.getRole().getRoleId());
                    roleResponse.setRoleName(userRole.getRole().getRoleName());
                    return roleResponse;
                })
                .collect(Collectors.toList());

        response.setRoles(roleResponses);
        return response;
    }


    // Cập nhật ảnh đại diện
    public void changeProfilePicture(String userId, MultipartFile file) {
        // Tìm kiếm người dùng
        UserEntity user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Kiểm tra định dạng file
        String fileExtension = getFileExtension(file.getOriginalFilename());
        if (!isImageFile(fileExtension)) {
            throw new IllegalArgumentException("Unsupported file type. Only .jpg, .jpeg, .png, .gif are allowed.");
        }

        // Xóa ảnh đại diện cũ trên MinIO (nếu có và là MinIO URL)
        if (user.getProfilePicture() != null && !user.getProfilePicture().isBlank()) {
            minioStorageService.deleteFile(user.getProfilePicture());
        }

        // Upload ảnh mới lên MinIO
        String newUrl = minioStorageService.uploadFile(file, "images");

        // Cập nhật đường dẫn ảnh đại diện
        user.setProfilePicture(newUrl);
        usersRepository.save(user);
    }

    // Kiểm tra định dạng file ảnh
    private boolean isImageFile(String extension) {
        if (extension == null) return false;
        String lowerCaseExt = extension.toLowerCase();
        return List.of(".jpg", ".jpeg", ".png", ".gif").contains(lowerCaseExt);
    }

    // Lấy đuôi file từ tên file
    private String getFileExtension(String fileName) {
        if (fileName != null && fileName.lastIndexOf('.') > 0) {
            return fileName.substring(fileName.lastIndexOf('.'));
        }
        return null;
    }

    public Boolean setShowShare(String userId){
        UserEntity user = usersRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Not found "+userId));
        user.setIsShowShare(true);
        usersRepository.save(user);
        return true;
    }


    public Boolean setOffShowShare(String userId){
        UserEntity user = usersRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Not found "+userId));
        user.setIsShowShare(false);
        usersRepository.save(user);
        return true;
    }

    public Boolean allowCheckShare(String userId){
        UserEntity user = usersRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Not found "+userId));
        return user.getIsShowShare();

    }

    public ProfileUserResponse updateProfile(String userId, UpdateProfileRequest request) {
        UserEntity user = usersRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Cập nhật tên và bio nếu có
        if (request.getUsername() != null) {
            user.setUsername(request.getUsername());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }

        // Cập nhật ảnh đại diện nếu có file được gửi lên
        if (request.getProfilePicture() != null && !request.getProfilePicture().isEmpty()) {
            MultipartFile file = request.getProfilePicture();

            // Kiểm tra định dạng file
            String fileExtension = getFileExtension(file.getOriginalFilename());
            if (!isImageFile(fileExtension)) {
                throw new IllegalArgumentException("Unsupported file type. Only .jpg, .jpeg, .png, .gif are allowed.");
            }

            // Xóa ảnh cũ trên MinIO (nếu có)
            if (user.getProfilePicture() != null && !user.getProfilePicture().isBlank()) {
                minioStorageService.deleteFile(user.getProfilePicture());
            }

            // Upload ảnh mới lên MinIO
            String newUrl = minioStorageService.uploadFile(file, "images");
            user.setProfilePicture(newUrl);
        }

        // Lưu lại vào DB
        usersRepository.save(user);

        // ── Gọi lại profile() để trả đầy đủ số liệu (post, follower, following) ──
        return profile(userId);
    }

}
