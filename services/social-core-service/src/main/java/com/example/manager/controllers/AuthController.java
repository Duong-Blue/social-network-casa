package com.example.manager.controllers;

import com.example.manager.dto.requests.user.*;
import com.example.manager.dto.responses.auth.AuthResponse;
import com.example.manager.dto.responses.common.ApiResponse;
import com.example.manager.dto.responses.user.UserResponse;
import com.example.manager.services.AuthenticationService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthenticationService authenticationService;

    @Value("${jwt.signerKey}")
    private String signerKey;

    public AuthController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest user) {
        String accessToken = authenticationService.authenticate(user.getEmail(), user.getPassword());
        AuthResponse authResponse = new AuthResponse(accessToken);
        ApiResponse<AuthResponse> apiResponse = new ApiResponse<>(201,"success",authResponse);
        return ResponseEntity.ok(apiResponse); // Trả về Access Token
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(Authentication authentication) {
        // Sử dụng AuthenticationService để xử lý logic trích xuất thông tin từ JWT
        UserResponse userResponse = authenticationService.getUserInfoFromJwt(authentication);
        ApiResponse<UserResponse> apiResponse = new ApiResponse<>(200,"success",userResponse);
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/gateway-verify")
    public ResponseEntity<Void> verifyGateway(Authentication authentication) {
        if (authentication == null || 
            !authentication.isAuthenticated() || 
            authentication instanceof org.springframework.security.authentication.AnonymousAuthenticationToken) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> requestPasswordReset(@RequestBody ForgotPasswordRequest request) {
        try {
            authenticationService.requestPasswordReset(request.getEmail());
            return ResponseEntity.ok(new ApiResponse(200, "Vui lòng kiểm tra email để đặt lại mật khẩu", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(400, e.getMessage(), null));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            authenticationService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(new ApiResponse(200, "Đặt lại mật khẩu thành công", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(400, e.getMessage(), null));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse> changePassword(@RequestBody ChangePasswordRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserResponse userResponse = authenticationService.getUserInfoFromJwt(authentication);

            authenticationService.changePassword(
                    userResponse.getUserId(),
                    request.getCurrentPassword(),
                    request.getNewPassword()
            );

            return ResponseEntity.ok(new ApiResponse(200, "Đổi mật khẩu thành công", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(400, e.getMessage(), null));
        }
    }





}
