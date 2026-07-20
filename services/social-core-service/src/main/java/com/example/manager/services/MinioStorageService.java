package com.example.manager.services;

import io.minio.*;
import io.minio.errors.*;
import io.minio.http.Method;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

/**
 * Service lưu trữ file sử dụng MinIO (S3-compatible object storage).
 * Thay thế toàn bộ cơ chế lưu file xuống disk (./uploads/).
 *
 * Pattern tham chiếu: communication-service/src/storage/minio.service.ts
 */
@Service
public class MinioStorageService {

    private static final Logger log = LoggerFactory.getLogger(MinioStorageService.class);

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    // Object name cố định của avatar mặc định trong bucket MinIO
    private static final String DEFAULT_AVATAR_OBJECT = "images/users.webp";
    // Classpath resource được đóng gói trong JAR
    private static final String DEFAULT_AVATAR_CLASSPATH = "static/images/users.webp";

    private MinioClient minioClient;

    /** URL đầy đủ của avatar mặc định, được set sau khi seed thành công */
    private String defaultAvatarUrl;

    private boolean minioAvailable = true;

    @PostConstruct
    public void init() {
        try {
            this.minioClient = MinioClient.builder()
                    .endpoint(endpoint)
                    .credentials(accessKey, secretKey)
                    .build();

            // Khởi tạo bucket và seed avatar mặc định
            initializeBucket();
            ensureDefaultAvatarExists();
            minioAvailable = true;
            log.info("MinIO kết nối thành công.");
        } catch (Exception e) {
            minioAvailable = false;
            log.warn("MinIO không khả dụng, sẽ dùng bộ nhớ local (./uploads/). Lỗi: {}", e.getMessage());
            // Tạo thư mục upload nếu chưa tồn tại
            try {
                Files.createDirectories(Paths.get(uploadDir, "images"));
            } catch (IOException ioEx) {
                log.error("Không thể tạo thư mục upload local: {}", ioEx.getMessage());
            }
        }
    }

    /**
     * Kiểm tra và tạo bucket nếu chưa tồn tại, đồng thời set policy public-read.
     */
    private void initializeBucket() throws Exception {
        boolean exists = minioClient.bucketExists(
                BucketExistsArgs.builder().bucket(bucketName).build()
        );

        if (!exists) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
            log.info("Bucket '{}' đã được tạo thành công.", bucketName);
        } else {
            log.info("Bucket '{}' đã tồn tại.", bucketName);
        }

        // Set policy public-read để client có thể truy cập file qua URL trực tiếp
        String policy = String.format(
                "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"AWS\":[\"*\"]},"
                        + "\"Action\":[\"s3:GetObject\"],\"Resource\":[\"arn:aws:s3:::%s/*\"]}]}",
                bucketName
        );
        minioClient.setBucketPolicy(
                SetBucketPolicyArgs.builder().bucket(bucketName).config(policy).build()
        );
        log.info("Đã set policy public-read cho bucket '{}'.", bucketName);
    }

    /**
     * Đảm bảo avatar mặc định (users.webp) đã tồn tại trong MinIO bucket.
     * Nếu chưa có, tự động upload từ file được đóng gói trong JAR (classpath).
     */
    private void ensureDefaultAvatarExists() {
        try {
            // Kiểm tra file đã tồn tại trong bucket chưa
            minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(bucketName)
                            .object(DEFAULT_AVATAR_OBJECT)
                            .build()
            );
            log.info("Avatar mặc định đã tồn tại trong MinIO: {}", DEFAULT_AVATAR_OBJECT);
        } catch (Exception notFound) {
            // File chưa tồn tại → upload từ classpath
            log.info("Avatar mặc định chưa có trong MinIO. Bắt đầu upload...");
            ClassPathResource resource = new ClassPathResource(DEFAULT_AVATAR_CLASSPATH);
            if (!resource.exists()) {
                log.warn("Không tìm thấy file avatar mặc định trong classpath: {}", DEFAULT_AVATAR_CLASSPATH);
                return;
            }
            try (InputStream is = resource.getInputStream()) {
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(bucketName)
                                .object(DEFAULT_AVATAR_OBJECT)
                                .stream(is, resource.contentLength(), -1)
                                .contentType("image/webp")
                                .build()
                );
                log.info("Đã upload avatar mặc định lên MinIO: {}", DEFAULT_AVATAR_OBJECT);
            } catch (Exception uploadError) {
                log.error("Không thể upload avatar mặc định: {}", uploadError.getMessage());
            }
        }
        // Lưu URL để UserService dùng
        this.defaultAvatarUrl = getPublicUrl(DEFAULT_AVATAR_OBJECT);
        log.info("URL avatar mặc định: {}", this.defaultAvatarUrl);
    }

    /**
     * Trả về URL public của avatar mặc định.
     * Được gọi bởi UserService khi tạo user mới.
     */
    public String getDefaultAvatarUrl() {
        if (!minioAvailable) {
            return "/images/users.webp";
        }
        if (defaultAvatarUrl == null) {
            // Fallback nếu chưa được khởi tạo
            defaultAvatarUrl = getPublicUrl(DEFAULT_AVATAR_OBJECT);
        }
        return defaultAvatarUrl;
    }

    /**
     * Upload file lên MinIO và trả về full public URL.
     *
     * @param file   MultipartFile cần upload
     * @param folder Thư mục đích trong bucket (vd: "images", "videos", "audios")
     * @return Full public URL của object vừa upload
     * @throws StorageException Khi có lỗi xảy ra trong quá trình upload
     */
    public String uploadFile(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File không được null hoặc rỗng.");
        }

        String extension = getFileExtension(file.getOriginalFilename());
        String fileName = UUID.randomUUID() + (extension != null ? extension : "");
        String objectName = folder + "/" + fileName;

        if (minioAvailable) {
            String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
            try (InputStream inputStream = file.getInputStream()) {
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(bucketName)
                                .object(objectName)
                                .stream(inputStream, file.getSize(), -1)
                                .contentType(contentType)
                                .build()
                );
                log.info("Upload thành công lên MinIO: {}", objectName);
                return getPublicUrl(objectName);
            } catch (Exception e) {
                log.warn("Upload lên MinIO thất bại, chuyển sang lưu local. Lỗi: {}", e.getMessage());
                // Fallback xuống local storage
            }
        }

        // Local fallback
        try {
            Path uploadPath = Paths.get(uploadDir, folder).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);
            Path filePath = uploadPath.resolve(fileName);
            try (InputStream is = file.getInputStream()) {
                Files.copy(is, filePath, StandardCopyOption.REPLACE_EXISTING);
            }
            log.info("Upload thành công xuống local: {}", filePath);
            return "/uploads/" + objectName;
        } catch (IOException e) {
            log.error("Lỗi khi upload file xuống local '{}': {}", objectName, e.getMessage());
            throw new StorageException("Không thể upload file: " + e.getMessage(), e);
        }
    }

    /**
     * Xóa object khỏi MinIO dựa vào full URL hoặc object name.
     *
     * @param fileUrl Full URL (http://host:port/bucket/objectName) hoặc chỉ objectName
     */
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return;
        }

        // Xóa file local (URL dạng /uploads/...)
        if (fileUrl.startsWith("/uploads/")) {
            String localPath = fileUrl.substring("/uploads/".length());
            Path filePath = Paths.get(uploadDir, localPath);
            try {
                Files.deleteIfExists(filePath);
                log.info("Xóa thành công file local: {}", filePath);
            } catch (IOException e) {
                log.warn("Không thể xóa file local '{}': {}", filePath, e.getMessage());
            }
            return;
        }

        // Xóa file trên MinIO
        String objectName = extractObjectName(fileUrl);
        if (objectName == null || objectName.isBlank()) {
            log.warn("Không thể xác định object name từ URL: {}", fileUrl);
            return;
        }

        if (!minioAvailable) {
            log.warn("MinIO không khả dụng, bỏ qua xóa object: {}", objectName);
            return;
        }

        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
            log.info("Xóa thành công object: {}", objectName);
        } catch (Exception e) {
            log.warn("Không thể xóa object '{}' khỏi MinIO. Lỗi: {}", objectName, e.getMessage());
        }
    }

    /**
     * Trả về full public URL cho một object trong bucket.
     *
     * @param objectName Tên object trong bucket (vd: "images/uuid.jpg")
     * @return URL dạng: http://endpoint/bucketName/objectName
     */
    public String getPublicUrl(String objectName) {
        return endpoint + "/" + bucketName + "/" + objectName;
    }

    /**
     * Tải file từ MinIO dưới dạng InputStream.
     *
     * @param folder   Thư mục chứa file (vd: "images")
     * @param fileName Tên file (vd: "uuid.jpg")
     * @return InputStream của file
     */
    public InputStream getFile(String folder, String fileName) {
        if (!minioAvailable) {
            throw new StorageException("MinIO không khả dụng.", null);
        }
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(folder + "/" + fileName)
                            .build()
            );
        } catch (Exception e) {
            throw new StorageException("Không thể lấy file từ MinIO: " + e.getMessage(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────

    /**
     * Trích xuất objectName từ full MinIO URL.
     * VD: "http://localhost:9000/casa/images/uuid.jpg" → "images/uuid.jpg"
     */
    private String extractObjectName(String fileUrl) {
        try {
            // Pattern: endpoint/bucketName/objectName
            String prefix = endpoint + "/" + bucketName + "/";
            if (fileUrl.startsWith(prefix)) {
                return fileUrl.substring(prefix.length());
            }
            // Trường hợp URL không có host prefix (legacy relative path như /images/uuid.jpg)
            // Bỏ qua, không cần xóa
            return null;
        } catch (Exception e) {
            log.warn("Không thể parse URL để lấy object name: {}", fileUrl);
            return null;
        }
    }

    /**
     * Lấy extension từ tên file.
     * VD: "photo.jpg" → ".jpg"
     */
    private String getFileExtension(String fileName) {
        if (fileName != null && fileName.lastIndexOf('.') > 0) {
            return fileName.substring(fileName.lastIndexOf('.'));
        }
        return null;
    }

    // ─────────────────────────────────────────────────────────────
    // CUSTOM EXCEPTION
    // ─────────────────────────────────────────────────────────────

    /**
     * Exception bọc lỗi từ MinIO, giúp Controller xử lý nhất quán.
     */
    public static class StorageException extends RuntimeException {
        public StorageException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
