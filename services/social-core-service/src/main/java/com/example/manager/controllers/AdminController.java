package com.example.manager.controllers;

import com.example.manager.dto.requests.admin.HandleUnblockRequest;
import com.example.manager.dto.requests.admin.LockUserRequest;
import com.example.manager.dto.requests.admin.UnblockRequest;
import com.example.manager.dto.responses.admin.LockedUserResponse;
import com.example.manager.dto.responses.admin.UnblockRequestResponse;
import com.example.manager.dto.responses.common.ApiResponse;
import com.example.manager.dto.responses.user.UserResponse;
import com.example.manager.services.AdminService;
import com.example.manager.services.AuthenticationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private AuthenticationService authenticationService;


    @PutMapping("/users/lock")
    public ResponseEntity<ApiResponse<String>> lockOrUnlockUser(@Valid @RequestBody LockUserRequest request) {
        adminService.lockOrUnlockUser(request.getUserId(), request.getIsLocked());
        String message = request.getIsLocked() ? "Đã khóa tài khoản thành công" : "Đã mở khóa tài khoản thành công";
        return ResponseEntity.ok(new ApiResponse<>(200, message, null));
    }

    // Người dùng gửi yêu cầu mở khóa (không cần admin role, nhưng cần xác thực email/password)
    @PostMapping("/unblock-request")
    public ResponseEntity<ApiResponse<UnblockRequestResponse>> submitUnblockRequest(
            @Valid @RequestBody UnblockRequest request) {
        UnblockRequestResponse response = adminService.submitUnblockRequestWithAuth(
                request.getEmail(), 
                request.getPassword(), 
                request.getMessage());
        return ResponseEntity.ok(new ApiResponse<>(200, "Đã gửi yêu cầu mở khóa thành công", response));
    }

    // Admin xem tất cả yêu cầu mở khóa
    @GetMapping("/unblock-requests")
    public ResponseEntity<ApiResponse<List<UnblockRequestResponse>>> getAllUnblockRequests() {
        List<UnblockRequestResponse> requests = adminService.getAllUnblockRequests();
        return ResponseEntity.ok(new ApiResponse<>(200, "success", requests));
    }

    // Admin xem yêu cầu mở khóa theo trạng thái
    @GetMapping("/unblock-requests/status/{status}")
    public ResponseEntity<ApiResponse<List<UnblockRequestResponse>>> getUnblockRequestsByStatus(
            @PathVariable("status") String status) {
        List<UnblockRequestResponse> requests = adminService.getUnblockRequestsByStatus(status);
        return ResponseEntity.ok(new ApiResponse<>(200, "success", requests));
    }

    // Admin xử lý yêu cầu mở khóa (chấp nhận hoặc từ chối)
    @PutMapping("/unblock-requests/handle")
    public ResponseEntity<ApiResponse<UnblockRequestResponse>> handleUnblockRequest(
            @Valid @RequestBody HandleUnblockRequest request) {
        UnblockRequestResponse response = adminService.handleUnblockRequest(request);
        String message = "APPROVE".equals(request.getAction()) 
            ? "Đã chấp nhận yêu cầu mở khóa" 
            : "Đã từ chối yêu cầu mở khóa";
        return ResponseEntity.ok(new ApiResponse<>(200, message, response));
    }

    // Người dùng xem yêu cầu mở khóa của mình
    @GetMapping("/unblock-requests/my-requests")
    public ResponseEntity<ApiResponse<List<UnblockRequestResponse>>> getMyUnblockRequests(
            Authentication authentication) {
        UserResponse userResponse = authenticationService.getUserInfoFromJwt(authentication);
        List<UnblockRequestResponse> requests = adminService.getUserUnblockRequests(userResponse.getUserId());
        return ResponseEntity.ok(new ApiResponse<>(200, "success", requests));
    }

    // Set admin role cho user
    @PostMapping("/users/{userId}/setAdmin")
    public ResponseEntity<ApiResponse<String>> setAdminRole(@PathVariable("userId") String userId) {
        adminService.setAdminRole(userId);
        return ResponseEntity.ok(new ApiResponse<>(200, "Đã cấp quyền admin thành công", null));
    }

    // Remove admin role từ user
    @DeleteMapping("/users/{userId}/removeAdmin")
    public ResponseEntity<ApiResponse<String>> removeAdminRole(@PathVariable("userId") String userId) {
        adminService.removeAdminRole(userId);
        return ResponseEntity.ok(new ApiResponse<>(200, "Đã xóa quyền admin thành công", null));
    }

    // Lấy danh sách tài khoản bị khóa
    @GetMapping("/users/locked")
    public ResponseEntity<ApiResponse<?>> getLockedUsers(
            @RequestParam(required = false) String name,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<LockedUserResponse> lockedUsers = adminService.getLockedUsers(name, page - 1, size);
        return ResponseEntity.ok(new ApiResponse<>(200, "success", lockedUsers));
    }
}


