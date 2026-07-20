import React, { useState, useEffect } from 'react';
import { View, Image, ActivityIndicator } from 'react-native';
import { getMediaUrl } from '@/utils/helpers/media_helper';

interface MediaThumbnailProps {
  url: string;
  className?: string;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  style?: any;
}

const isVideoUrl = (url: string) => {
  if (!url) return false;
  const ext = url.split('.').pop()?.toLowerCase();
  return ['mp4', 'm4v', 'mov', 'avi', 'mkv', 'webm', '3gp'].includes(ext || '');
};

export default function MediaThumbnail({ url, className, resizeMode = 'cover', style }: MediaThumbnailProps) {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isVideo = isVideoUrl(url);

  useEffect(() => {
    if (isVideo && url) {
      setIsLoading(true);
      const videoUrl = getMediaUrl(url);
      import('expo-video-thumbnails')
        .then(VideoThumbnails => {
          VideoThumbnails.getThumbnailAsync(videoUrl, { time: 0 })
            .then(result => {
              setThumbnailUri(result.uri);
              setIsLoading(false);
            })
            .catch(err => {
              console.warn('Lỗi sinh thumbnail video:', err);
              setIsLoading(false);
            });
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [isVideo, url]);

  if (isVideo) {
    if (isLoading) {
      return (
        <View style={[{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }, style]} className={className}>
          <ActivityIndicator size="small" color="#8B5CF6" />
        </View>
      );
    }
    return (
      <View style={[{ position: 'relative' }, style]} className={className}>
        <Image
          source={{ uri: thumbnailUri || `https://ui-avatars.com/api/?name=V&background=7c3bed&color=fff` }}
          className="w-full h-full"
          resizeMode={resizeMode}
        />
        {/* Play Icon Overlay để chỉ thị đây là video */}
        <View style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginLeft: -12,
          marginTop: -12,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            width: 0,
            height: 0,
            borderLeftWidth: 8,
            borderLeftColor: '#FFF',
            borderTopWidth: 5,
            borderTopColor: 'transparent',
            borderBottomWidth: 5,
            borderBottomColor: 'transparent',
            marginLeft: 2,
          }} />
        </View>
      </View>
    );
  }

  // Nếu là ảnh bình thường
  return (
    <Image
      source={{ uri: getMediaUrl(url) }}
      className={className}
      resizeMode={resizeMode}
      style={style}
    />
  );
}
