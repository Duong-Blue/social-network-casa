package com.example.manager.services;

import com.example.manager.dto.requests.admin.HandleUnblockRequest;
import com.example.manager.dto.requests.admin.UnblockRequest;
import com.example.manager.dto.responses.admin.LockedUserResponse;
import com.example.manager.dto.responses.admin.UnblockRequestResponse;
import com.example.manager.models.RoleEntity;
import com.example.manager.models.UnblockRequestEntity;
import com.example.manager.models.UserEntity;
import com.example.manager.models.UserRoleEntity;
import com.example.manager.repositories.RoleRepository;
import com.example.manager.repositories.UnblockRequestRepository;
import com.example.manager.repositories.UserRepository;
import com.example.manager.repositories.UserRoleRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UnblockRequestRepository unblockRequestRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    // Khóa/Mở khóa tài khoản người dùng
    public void lockOrUnlockUser(String userId, Boolean isLocked) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setIsLocked(isLocked);
        user.setUpdatedAt(new Timestamp(System.currentTimeMillis()));
        userRepository.save(user);
    }

    // Người dùng gửi yêu cầu mở khóa (với xác thực email/password)
    public UnblockRequestResponse submitUnblockRequestWithAuth(String email, String password, String message) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Email không tồn tại"));

        // Xác thực mật khẩu
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Mật khẩu không đúng");
        }

        // Kiểm tra xem đã có yêu cầu đang chờ xử lý chưa
        unblockRequestRepository.findByUserUserIdAndStatus(user.getUserId(), "PENDING")
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn đã có yêu cầu mở khóa đang chờ xử lý");
                });

        UnblockRequestEntity unblockRequest = new UnblockRequestEntity();
        unblockRequest.setUser(user);
        unblockRequest.setMessage(message);
        unblockRequest.setStatus("PENDING");
        unblockRequest.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        unblockRequest.setUpdatedAt(new Timestamp(System.currentTimeMillis()));

        UnblockRequestEntity saved = unblockRequestRepository.save(unblockRequest);
        return mapToResponse(saved);
    }

    // Người dùng gửi yêu cầu mở khóa (với userId - dùng khi đã đăng nhập)
    public UnblockRequestResponse submitUnblockRequest(String userId, UnblockRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Kiểm tra xem đã có yêu cầu đang chờ xử lý chưa
        unblockRequestRepository.findByUserUserIdAndStatus(userId, "PENDING")
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn đã có yêu cầu mở khóa đang chờ xử lý");
                });

        UnblockRequestEntity unblockRequest = new UnblockRequestEntity();
        unblockRequest.setUser(user);
        unblockRequest.setMessage(request.getMessage());
        unblockRequest.setStatus("PENDING");
        unblockRequest.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        unblockRequest.setUpdatedAt(new Timestamp(System.currentTimeMillis()));

        UnblockRequestEntity saved = unblockRequestRepository.save(unblockRequest);
        return mapToResponse(saved);
    }

    // Lấy tất cả yêu cầu mở khóa
    public List<UnblockRequestResponse> getAllUnblockRequests() {
        List<UnblockRequestEntity> requests = unblockRequestRepository.findAll();
        return requests.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Lấy yêu cầu mở khóa theo trạng thái
    public List<UnblockRequestResponse> getUnblockRequestsByStatus(String status) {
        List<UnblockRequestEntity> requests = unblockRequestRepository.findByStatus(status);
        return requests.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Admin xử lý yêu cầu mở khóa (chấp nhận hoặc từ chối)
    public UnblockRequestResponse handleUnblockRequest(HandleUnblockRequest request) {
        UnblockRequestEntity unblockRequest = unblockRequestRepository.findById(request.getRequestId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unblock request not found"));

        if (!"PENDING".equals(unblockRequest.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request đã được xử lý");
        }

        if ("APPROVE".equals(request.getAction())) {
            // Chấp nhận: mở khóa tài khoản
            UserEntity user = unblockRequest.getUser();
            user.setIsLocked(false);
            user.setUpdatedAt(new Timestamp(System.currentTimeMillis()));
            userRepository.save(user);

            unblockRequest.setStatus("APPROVED");
        } else if ("REJECT".equals(request.getAction())) {
            // Từ chối
            unblockRequest.setStatus("REJECTED");
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Action không hợp lệ. Phải là APPROVE hoặc REJECT");
        }

        unblockRequest.setAdminResponse(request.getAdminResponse());
        unblockRequest.setUpdatedAt(new Timestamp(System.currentTimeMillis()));
        UnblockRequestEntity saved = unblockRequestRepository.save(unblockRequest);

        return mapToResponse(saved);
    }

    // Lấy yêu cầu mở khóa của một người dùng
    public List<UnblockRequestResponse> getUserUnblockRequests(String userId) {
        List<UnblockRequestEntity> requests = unblockRequestRepository.findByUserUserId(userId);
        return requests.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Set admin role cho user
    public void setAdminRole(String userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Tìm hoặc tạo role ADMIN
        RoleEntity adminRole = roleRepository.findByRoleName("ADMIN")
                .orElseGet(() -> {
                    RoleEntity newRole = new RoleEntity();
                    newRole.setRoleName("ADMIN");
                    newRole.setDescription("Administrator role");
                    return roleRepository.save(newRole);
                });

        // Kiểm tra xem user đã có role ADMIN chưa
        boolean hasAdminRole = user.getUserRoles().stream()
                .anyMatch(userRole -> "ADMIN".equals(userRole.getRole().getRoleName()));

        if (!hasAdminRole) {
            // Thêm role ADMIN cho user
            UserRoleEntity userRole = new UserRoleEntity();
            userRole.setUser(user);
            userRole.setRole(adminRole);
            userRoleRepository.save(userRole);
        }
    }

    // Remove admin role từ user
    public void removeAdminRole(String userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Tìm và xóa role ADMIN
        List<UserRoleEntity> adminRoles = user.getUserRoles().stream()
                .filter(userRole -> "ADMIN".equals(userRole.getRole().getRoleName()))
                .collect(Collectors.toList());

        for (UserRoleEntity adminRole : adminRoles) {
            userRoleRepository.delete(adminRole);
        }
    }

    // Lấy danh sách tài khoản bị khóa
    public Page<LockedUserResponse> getLockedUsers(String name, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserEntity> usersPage;
        
        if (name != null && !name.trim().isEmpty()) {
            usersPage = userRepository.findLockedUsersByName(name, pageable);
        } else {
            usersPage = userRepository.findLockedUsers(pageable);
        }
        
        // Map UserEntity sang LockedUserResponse để tránh lazy loading issues
        return usersPage.map(user -> {
            LockedUserResponse response = new LockedUserResponse();
            response.setUserId(user.getUserId());
            response.setUsername(user.getUsername());
            response.setEmail(user.getEmail());
            response.setProfilePicture(user.getProfilePicture());
            response.setCreatedAt(user.getCreatedAt());
            response.setIsLocked(user.getIsLocked());
            return response;
        });
    }

    private UnblockRequestResponse mapToResponse(UnblockRequestEntity entity) {
        UnblockRequestResponse response = new UnblockRequestResponse();
        response.setRequestId(entity.getRequestId());
        response.setUserId(entity.getUser().getUserId());
        response.setUsername(entity.getUser().getUsername());
        response.setEmail(entity.getUser().getEmail());
        response.setMessage(entity.getMessage());
        response.setStatus(entity.getStatus());
        response.setAdminResponse(entity.getAdminResponse());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }
}

