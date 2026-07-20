const BASE_URL_API = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.8:8080/api/v1';
const BASE_URL = BASE_URL_API?.replace('/api/v1', '');

// Hàm trích xuất Host IP từ chuỗi API
const getHostIp = () => {
    try {
        const urlObj = new URL(BASE_URL);
        return urlObj.hostname;
    } catch (e) {
        return '192.168.1.8'; // Fallback an toàn
    }
};

/**
 * Chuyển đổi đường dẫn tương đối từ backend thành URL tuyệt đối.
 * Ví dụ: "images/abc.jpg" -> "http://192.168.1.8:8080/images/abc.jpg"
 * Chỉ hỗ trợ backend media paths, không phải local URIs (file://, content://).
 */
export const getMediaUrl = (path: string | null | undefined): string => {
    if (!path) {
        return '';
    }

    // Nếu là local native URIs (file://, content://, data:), trả về nguyên trạng để hiển thị ảnh cục bộ
    if (path.startsWith('file://') || path.startsWith('content://') || path.startsWith('data:')) {
        return path;
    }

    // Nếu đường dẫn đã là URL đầy đủ (trả về bởi backend)
    if (path.startsWith('http://') || path.startsWith('https://')) {
        // Nếu URL trỏ tới MinIO nội bộ (chứa port 9000 hoặc chứa bucket '/casa/')
        // Ví dụ: http://minio:9000/casa/messages/123.jpg -> http://IP:8080/files/messages/123.jpg
        if (path.includes(':9000/') || path.includes('/casa/')) {
            try {
                const parts = path.split('/casa/');
                if (parts.length > 1) {
                    const fileRelativePath = parts[1]; // ví dụ: "messages/abc.jpg"
                    return `${BASE_URL}/files/${fileRelativePath}`;
                }
            } catch (e) {
                console.error('Error parsing MinIO URL:', e);
            }
        }
        return path;
    }

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
};
