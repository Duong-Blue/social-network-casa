package com.example.manager.services;

import com.example.manager.dto.responses.user.UserResponse;
import com.example.manager.models.UserEntity;
import com.example.manager.repositories.RoleRepository;
import com.example.manager.repositories.UserRepository;
import com.example.manager.repositories.UserRoleRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AuthenticationService {

    @Autowired
    private  UserRepository usersRepository;

    @Autowired
    private  PasswordEncoder passwordEncoder;

    @Autowired
    private  UserRoleRepository userRoleRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private EmailService emailService;

    @Value("${jwt.signerKey}")
    private String signerKey;

    private final long EXPIRATION_TIME = 86400000; // 24 giờ


    public String authenticate(String email, String password) {
        UserEntity user = usersRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized: Invalid credentials");
        }

        // Kiểm tra tài khoản có bị khóa không
        if (user.getIsLocked() != null && user.getIsLocked()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị khóa");
        }

        String accessToken = generateToken(user);
        usersRepository.save(user); // Cập nhật người dùng với Refresh Token

        return accessToken; // Trả về Access Token
    }



    private String generateToken(UserEntity user) {
        // Lấy danh sách vai trò
        Collection<String> roles = user.getUserRoles().stream()
                .map(userRole -> userRole.getRole().getRoleName())
                .collect(Collectors.toList());

        // Tạo các claims cho token
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", roles); // Đặt vai trò vào claims như danh sách

        claims.put("userId", user.getUserId());
        claims.put("username", user.getUsername());


        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(SignatureAlgorithm.HS512, signerKey)
                .compact();
    }




    public UserResponse getUserInfoFromJwt(Authentication authentication) {
        // Lấy đối tượng Jwt từ Authentication object
        Jwt jwt = (Jwt) authentication.getCredentials();

        // Lấy các claims từ JWT
        Map<String, Object> claims = jwt.getClaims();

        // Trích xuất userId từ claims
        String userId = (String) claims.get("userId");

        // Truy vấn database để lấy thông tin mới nhất
        UserEntity user = usersRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Tạo và thiết lập đối tượng UserResponse
        UserResponse userResponse = new UserResponse();
        userResponse.setUserId(user.getUserId());
        userResponse.setUsername(user.getUsername());
        userResponse.setProfilePicture(user.getProfilePicture());
        
        // Lấy danh sách vai trò từ userRoles
        List<String> roles = user.getUserRoles().stream()
                .map(userRole -> userRole.getRole().getRoleName())
                .collect(Collectors.toList());
        userResponse.setRoles(roles);

        return userResponse;
    }


    public void requestPasswordReset(String email) {
        UserEntity user = usersRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Email không tồn tại"));

        // Tạo token đặt lại mật khẩu
        String resetToken = generateResetToken(user);

        // Lưu token vào database
        user.setResetPasswordToken(resetToken);
        user.setResetPasswordExpires(new Date(System.currentTimeMillis() + EXPIRATION_TIME));
        usersRepository.save(user);

        // TODO: Gửi email chứa link đặt lại mật khẩu
        emailService.sendPasswordResetEmail(user.getEmail(), resetToken);
    }

    public void resetPassword(String token, String newPassword) {
        UserEntity user = usersRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Token không hợp lệ"));

        // Kiểm tra token còn hiệu lực
        if (user.getResetPasswordExpires().before(new Date())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token đã hết hạn");
        }

        // Cập nhật mật khẩu mới
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetPasswordExpires(null);
        usersRepository.save(user);
    }

    public void changePassword(String userId, String currentPassword, String newPassword) {
        UserEntity user = usersRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));

        // Kiểm tra mật khẩu hiện tại
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Mật khẩu hiện tại không đúng");
        }

        // Cập nhật mật khẩu mới
        user.setPassword(passwordEncoder.encode(newPassword));
        usersRepository.save(user);
    }

    private String generateResetToken(UserEntity user) {
        // Tạo token ngẫu nhiên
        String token = UUID.randomUUID().toString();

        // Mã hóa token với thông tin người dùng
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getUserId());
        claims.put("email", user.getEmail());

        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(SignatureAlgorithm.HS512, signerKey)
                .compact();
    }
}
