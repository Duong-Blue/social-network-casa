import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Animated as RNAnimated,
  Platform,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import VideoPlayer from '@/components/VideoPlayer';
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { getMediaUrl } from '@/utils/helpers/media_helper';

// Định nghĩa interface PostImage theo yêu cầu của bạn
export interface PostImage {
  id: string;
  url: string;
}

interface MultiImageGridProps {
  images: PostImage[];
  onLikeDoubleTap?: () => void;
  isActive?: boolean;
}

const VIDEO_EXTENSIONS = new Set(['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv']);

const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  // Loại bỏ phần query parameters đằng sau dấu ? nếu có (ví dụ đối với presigned URLs từ MinIO)
  const cleanUrl = url.split('?')[0];
  const ext = cleanUrl.substring(cleanUrl.lastIndexOf('.')).toLowerCase();
  return VIDEO_EXTENSIONS.has(ext);
};

// Helper lấy thumbnail URL tối ưu cho Cloudinary CDN, fallback về URL gốc nếu không phù hợp
export const getThumbnailUrl = (url: string): string => {
  const fullUrl = getMediaUrl(url);
  if (!fullUrl) return '';
  if (fullUrl.includes('res.cloudinary.com')) {
    // Cloudinary hỗ trợ resize ảnh động bằng cách chèn c_limit,w_500 vào giữa path upload/
    return fullUrl.replace('/upload/', '/upload/c_limit,w_500/');
  }
  return fullUrl;
};

// Helper lấy URL ảnh gốc
export const getOriginalUrl = (url: string): string => {
  return getMediaUrl(url);
};

// Sub-component: Skeleton Loading nhấp nháy
function SkeletonImage() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bg = isDark ? '#1E1445' : '#E8E4EF';
  const pulseAnim = useRef(new RNAnimated.Value(0.5)).current;

  useEffect(() => {
    const anim = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        RNAnimated.timing(pulseAnim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

  return (
    <RNAnimated.View
      style={{
        ...StyleSheet.absoluteFillObject,
        backgroundColor: bg,
        opacity: pulseAnim,
        borderRadius: 8,
      }}
    />
  );
}

// Sub-component: Từng ảnh đơn hiển thị trên Grid Feed
interface GridImageItemProps {
  image: PostImage;
  index: number;
  onPress: (index: number) => void;
  onDoubleTap?: () => void;
  style: any;
  overlayText?: string;
  isActive?: boolean;
}

function GridImageItem({
  image,
  index,
  onPress,
  onDoubleTap,
  style,
  overlayText,
  isActive,
}: GridImageItemProps) {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // Trạng thái phát video inline
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isVideo = isVideoUrl(image.url);

  const lastTap = useRef(0);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // Tự động play/pause video inline khi bài viết được focus (lướt tới)
  useEffect(() => {
    if (isVideo) {
      if (isActive) {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    }
  }, [isActive, isVideo]);

  // Sinh thumbnail video ở giây đầu tiên (time: 0)
  useEffect(() => {
    if (isVideo && image.url) {
      const videoUrl = getMediaUrl(image.url);
      import('expo-video-thumbnails')
        .then(VideoThumbnails => {
          VideoThumbnails.getThumbnailAsync(videoUrl, { time: 0 })
            .then(result => {
              setVideoThumbnail(result.uri);
            })
            .catch(err => {
              console.warn('Lỗi sinh thumbnail video:', err);
            });
        })
        .catch(() => {});
    }
  }, [isVideo, image.url]);



  // Xử lý phân biệt Single Tap (Mở Gallery) và Double Tap (Thả tim)
  const handlePress = () => {
    if (isPlaying) return; // Nếu đang play video inline thì click không kích hoạt gallery

    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      lastTap.current = 0;
      onDoubleTap?.();
    } else {
      lastTap.current = now;
      timer.current = setTimeout(() => {
        onPress(index);
        timer.current = null;
      }, 300);
    }
  };

  const thumbnailUrl = getThumbnailUrl(image.url);
  const originalUrl = getOriginalUrl(image.url);

  // Nếu là video và đang chọn phát inline tại chỗ
  if (isVideo && isPlaying) {
    return (
      <View style={[style, { position: 'relative', backgroundColor: '#000', overflow: 'hidden' }]}>
        <VideoPlayer uri={originalUrl} style={StyleSheet.absoluteFill} />
        <TouchableOpacity
          onPress={() => setIsPlaying(false)}
          activeOpacity={0.7}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: 999,
            padding: 6,
            zIndex: 20,
          }}
        >
          <MaterialIcons name="close" size={18} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={[style, { position: 'relative', overflow: 'hidden' }]}
    >
      {isVideo ? (
        // Nếu là video, render ảnh thumbnail của giây đầu tiên
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#000' }}>
          {videoThumbnail ? (
            <Image
              source={{ uri: videoThumbnail }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: isDark ? '#140E2E' : '#E2E8F0',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="videocam" size={36} color={isDark ? '#7C3AED' : '#06B6D4'} style={{ opacity: 0.8 }} />
            </View>
          )}
        </View>
      ) : hasError ? (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: isDark ? '#1E1445' : '#E2E8F0',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons name="broken-image" size={32} color={isDark ? '#94A3B8' : '#64748B'} />
          <Text style={{ fontSize: 10, color: isDark ? '#64748B' : '#94A3B8', marginTop: 4 }}>
            Lỗi tải ảnh
          </Text>
        </View>
      ) : (
        <Image
          source={{ uri: thumbnailUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          onLoadStart={() => setLoading(true)}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setHasError(true);
          }}
        />
      )}

      {loading && !isVideo && <SkeletonImage />}

      {isVideo && (
        <TouchableOpacity
          onPress={() => setIsPlaying(true)} // Click nút play để phát inline tại chỗ
          activeOpacity={0.8}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: [{ translateX: -20 }, { translateY: -20 }],
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <View
            style={{
              backgroundColor: 'rgba(0,0,0,0.65)',
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
              elevation: 4,
            }}
          >
            <MaterialIcons name="play-arrow" size={32} color="white" />
          </View>
        </TouchableOpacity>
      )}

      {overlayText && (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: 'white', fontSize: 26, fontWeight: 'bold' }}>
            {overlayText}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Sub-component: Zoomable Image cho mỗi ảnh trong Gallery Modal
interface ZoomableImageProps {
  url: string;
  onZoomStateChange: (isZoomed: boolean) => void;
  containerWidth: number;
  containerHeight: number;
}

function ZoomableImage({
  url,
  onZoomStateChange,
  containerWidth,
  containerHeight,
}: ZoomableImageProps) {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Theo dõi sự thay đổi scale để tắt/bật scroll của PagerView ở component cha
  useAnimatedReaction(
    () => scale.value > 1,
    (isZoomed, prevIsZoomed) => {
      if (isZoomed !== prevIsZoomed) {
        runOnJS(onZoomStateChange)(isZoomed);
      }
    }
  );

  // Cử chỉ Pinch to Zoom
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(savedScale.value * event.scale, 0.8), 5);
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      } else if (scale.value > 4) {
        scale.value = withTiming(4);
      }
    });

  // Cử chỉ Pan (Dịch chuyển khi đã zoom)
  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      } else {
        // Giới hạn biên độ pan để ảnh không bị biến mất khỏi vùng hiển thị
        const maxTx = (scale.value - 1) * (containerWidth / 2);
        const maxTy = (scale.value - 1) * (containerHeight / 2);
        if (translateX.value > maxTx) translateX.value = withTiming(maxTx);
        if (translateX.value < -maxTx) translateX.value = withTiming(-maxTx);
        if (translateY.value > maxTy) translateY.value = withTiming(maxTy);
        if (translateY.value < -maxTy) translateY.value = withTiming(-maxTy);
      }
    });

  // Cử chỉ Double Tap to Zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      } else {
        scale.value = withTiming(2.5);
      }
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);
  const gesture = Gesture.Exclusive(composedGesture, doubleTapGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const originalUrl = getOriginalUrl(url);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          {
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          },
          animatedStyle,
        ]}
      >
        {hasError ? (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="broken-image" size={54} color="#475569" />
            <Text style={{ color: '#64748B', marginTop: 10, fontSize: 13 }}>
              Không thể tải ảnh gốc
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: originalUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
            onLoadStart={() => setLoading(true)}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setHasError(true);
            }}
          />
        )}

        {loading && !hasError && (
          <View style={{ position: 'absolute', zIndex: 1 }}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

// Sub-component: Image Gallery Modal full-screen
interface ImageGalleryModalProps {
  images: PostImage[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
}

function ImageGalleryModal({
  images,
  initialIndex,
  visible,
  onClose,
}: ImageGalleryModalProps) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const pagerRef = useRef<PagerView>(null);

  const { width, height } = Dimensions.get('window');

  // Đảm bảo pager hiển thị đúng index khi mở Gallery
  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      setScrollEnabled(true);
      setTimeout(() => {
        pagerRef.current?.setPageWithoutAnimation(initialIndex);
      }, 80);
    }
  }, [visible, initialIndex]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000000' }}>
        {/* Header bar: Hiển thị chỉ số ảnh và Nút Close */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: 12,
            paddingHorizontal: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            zIndex: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '600' }}>
            Image {currentIndex + 1} / {images.length}
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={{
              padding: 6,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
            }}
          >
            <MaterialIcons name="close" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Swipable Pager */}
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={initialIndex}
          onPageSelected={(e) => setCurrentIndex(e.nativeEvent.position)}
          scrollEnabled={scrollEnabled}
        >
          {images.map((img, idx) => (
            <View
              key={img.id || `${img.url}-${idx}`}
              style={{
                width: width,
                height: height,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {isVideoUrl(img.url) ? (
                <VideoPlayer uri={getOriginalUrl(img.url)} />
              ) : (
                <ZoomableImage
                  url={img.url}
                  onZoomStateChange={(isZoomed) => setScrollEnabled(!isZoomed)}
                  containerWidth={width}
                  containerHeight={height}
                />
              )}
            </View>
          ))}
        </PagerView>

        {/* Nút điều hướng Trái (<) */}
        {scrollEnabled && currentIndex > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              const prevIndex = currentIndex - 1;
              pagerRef.current?.setPage(prevIndex);
              setCurrentIndex(prevIndex);
            }}
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              marginTop: -24,
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.15)',
            }}
          >
            <MaterialIcons name="chevron-left" size={32} color="#ffffff" />
          </TouchableOpacity>
        )}

        {/* Nút điều hướng Phải (>) */}
        {scrollEnabled && currentIndex < images.length - 1 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              const nextIndex = currentIndex + 1;
              pagerRef.current?.setPage(nextIndex);
              setCurrentIndex(nextIndex);
            }}
            style={{
              position: 'absolute',
              right: 16,
              top: '50%',
              marginTop: -24,
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.15)',
            }}
          >
            <MaterialIcons name="chevron-right" size={32} color="#ffffff" />
          </TouchableOpacity>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

// COMPONENT CHÍNH: MultiImageGrid
export default function MultiImageGrid({
  images,
  onLikeDoubleTap,
  isActive,
}: MultiImageGridProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(-1);

  // Xác định khoảng cách gap theo kích thước responsive
  const { width: screenWidth } = Dimensions.get('window');
  const isMobile = screenWidth < 768;
  const gap = isMobile ? 2 : 4;

  const onLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      setContainerWidth(width);
    }
  };

  const handleImagePress = (index: number) => {
    setGalleryIndex(index);
  };

  const handleCloseGallery = () => {
    setGalleryIndex(-1);
  };

  // Tính toán chiều rộng khả dụng mặc định khi chưa đo layout
  const defaultWidth = screenWidth < 768 ? screenWidth - 32 : Math.min(screenWidth - 32, 700);
  const activeWidth = containerWidth || defaultWidth;

  const gridStyle = {
    borderRadius: 12,
    overflow: 'hidden' as const,
    width: '100%' as const,
    maxWidth: 700,
    alignSelf: 'center' as const,
  };

  const renderGallery = () => (
    <ImageGalleryModal
      images={images}
      initialIndex={galleryIndex}
      visible={galleryIndex >= 0}
      onClose={handleCloseGallery}
    />
  );

  // Không có ảnh thì không hiển thị
  if (!images || images.length === 0) return null;

  // RULE 1: 1 Image (4:3 aspect ratio, full width)
  if (images.length === 1) {
    return (
      <View onLayout={onLayout} style={gridStyle}>
        <GridImageItem
          image={images[0]}
          index={0}
          onPress={handleImagePress}
          onDoubleTap={onLikeDoubleTap}
          style={{ width: activeWidth, height: activeWidth * 0.75 }}
          isActive={isActive}
        />
        {renderGallery()}
      </View>
    );
  }

  // RULE 2: 2 Images (2 columns equal size)
  if (images.length === 2) {
    const itemWidth = (activeWidth - gap) / 2;
    return (
      <View
        onLayout={onLayout}
        style={[gridStyle, { flexDirection: 'row', gap }]}
      >
        <GridImageItem
          image={images[0]}
          index={0}
          onPress={handleImagePress}
          onDoubleTap={onLikeDoubleTap}
          style={{ width: itemWidth, height: itemWidth }}
          isActive={isActive}
        />
        <GridImageItem
          image={images[1]}
          index={1}
          onPress={handleImagePress}
          onDoubleTap={onLikeDoubleTap}
          style={{ width: itemWidth, height: itemWidth }}
          isActive={isActive}
        />
        {renderGallery()}
      </View>
    );
  }

  // RULE 3: 3 Images (1 top full width, 2 bottom columns)
  if (images.length === 3) {
    const topHeight = activeWidth * 0.5625; // tỉ lệ 16:9
    const bottomWidth = (activeWidth - gap) / 2;
    return (
      <View
        onLayout={onLayout}
        style={[gridStyle, { flexDirection: 'column', gap }]}
      >
        <GridImageItem
          image={images[0]}
          index={0}
          onPress={handleImagePress}
          onDoubleTap={onLikeDoubleTap}
          style={{ width: activeWidth, height: topHeight }}
          isActive={isActive}
        />
        <View style={{ flexDirection: 'row', gap }}>
          <GridImageItem
            image={images[1]}
            index={1}
            onPress={handleImagePress}
            onDoubleTap={onLikeDoubleTap}
            style={{ width: bottomWidth, height: bottomWidth }}
            isActive={isActive}
          />
          <GridImageItem
            image={images[2]}
            index={2}
            onPress={handleImagePress}
            onDoubleTap={onLikeDoubleTap}
            style={{ width: bottomWidth, height: bottomWidth }}
            isActive={isActive}
          />
        </View>
        {renderGallery()}
      </View>
    );
  }

  // RULE 4: 4 Images (2x2 grid equal size)
  if (images.length === 4) {
    const size = (activeWidth - gap) / 2;
    return (
      <View
        onLayout={onLayout}
        style={[gridStyle, { flexDirection: 'column', gap }]}
      >
        <View style={{ flexDirection: 'row', gap }}>
          <GridImageItem
            image={images[0]}
            index={0}
            onPress={handleImagePress}
            onDoubleTap={onLikeDoubleTap}
            style={{ width: size, height: size }}
            isActive={isActive}
          />
          <GridImageItem
            image={images[1]}
            index={1}
            onPress={handleImagePress}
            onDoubleTap={onLikeDoubleTap}
            style={{ width: size, height: size }}
            isActive={isActive}
          />
        </View>
        <View style={{ flexDirection: 'row', gap }}>
          <GridImageItem
            image={images[2]}
            index={2}
            onPress={handleImagePress}
            onDoubleTap={onLikeDoubleTap}
            style={{ width: size, height: size }}
            isActive={isActive}
          />
          <GridImageItem
            image={images[3]}
            index={3}
            onPress={handleImagePress}
            onDoubleTap={onLikeDoubleTap}
            style={{ width: size, height: size }}
            isActive={isActive}
          />
        </View>
        {renderGallery()}
      </View>
    );
  }

  // RULE 5: More than 4 Images (render first 4 images with overlay +N on 4th image)
  const size = (activeWidth - gap) / 2;
  const overlayText = `+${images.length - 4}`;
  return (
    <View
      onLayout={onLayout}
      style={[gridStyle, { flexDirection: 'column', gap }]}
    >
      <View style={{ flexDirection: 'row', gap }}>
        <GridImageItem
          image={images[0]}
          index={0}
          onPress={handleImagePress}
          onDoubleTap={onLikeDoubleTap}
          style={{ width: size, height: size }}
          isActive={isActive}
        />
        <GridImageItem
          image={images[1]}
          index={1}
          onPress={handleImagePress}
          onDoubleTap={onLikeDoubleTap}
          style={{ width: size, height: size }}
          isActive={isActive}
        />
      </View>
      <View style={{ flexDirection: 'row', gap }}>
        <GridImageItem
          image={images[2]}
          index={2}
          onPress={handleImagePress}
          onDoubleTap={onLikeDoubleTap}
          style={{ width: size, height: size }}
          isActive={isActive}
        />
        <GridImageItem
          image={images[3]}
          index={3}
          onPress={handleImagePress}
          onDoubleTap={onLikeDoubleTap}
          style={{ width: size, height: size }}
          overlayText={overlayText}
          isActive={isActive}
        />
      </View>
      {renderGallery()}
    </View>
  );
}
