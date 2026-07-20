package com.example.manager.controllers;

import com.example.manager.services.MinioStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.InputStream;
import java.net.URLConnection;

@RestController
@RequestMapping("/casa")
@RequiredArgsConstructor
@Slf4j
public class MediaController {

    private final MinioStorageService minioStorageService;

    @GetMapping("/{folder}/{fileName}")
    public ResponseEntity<Resource> getMedia(@PathVariable String folder, @PathVariable String fileName) {
        try {
            InputStream is = minioStorageService.getFile(folder, fileName);
            String contentType = URLConnection.guessContentTypeFromName(fileName);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=31536000") // Cache 1 năm
                    .body(new InputStreamResource(is));
        } catch (Exception e) {
            log.error("Lỗi khi tải media từ MinIO cho {}/{}: {}", folder, fileName, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}
