package com.example.manager.controllers;

import com.example.manager.dto.requests.share.ShareRequest;
import com.example.manager.dto.responses.common.ApiResponse;
import com.example.manager.dto.responses.share.ShareResponse;
import com.example.manager.services.ShareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/api/v1/share")
public class ShareController {
    @Autowired
    private ShareService shareService;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<?>> createShare(@RequestBody ShareRequest shareRequest){
        ShareResponse shareResponse = shareService.createShare(shareRequest);
        return ResponseEntity.ok(new ApiResponse<>(200, "Đã share bài viết", shareResponse));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<?>> getShareByUser(@PathVariable("userId") String userId,@RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "10") int size){
        Page<ShareResponse> listShare = shareService.getShareByUser(userId,page-1,size);
        return ResponseEntity.ok(new ApiResponse<>(200, "Danh sách các bài đã share ", listShare));
    }

    @DeleteMapping("/delete/{shareId}")
    public ResponseEntity<ApiResponse<?>> getShareByUser(@PathVariable("shareId") String shareId){
        Boolean isShare = shareService.deleteShare(shareId);
        return ResponseEntity.ok(new ApiResponse<>(200, "Xóa thành công", isShare));
    }

}
