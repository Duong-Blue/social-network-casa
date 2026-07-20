import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

interface VideoPlayerProps {
  uri: string;
  style?: any;
}

export default function VideoPlayer({ uri, style }: VideoPlayerProps) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.muted = false;
    player.play(); // Tự động phát ngay từ đầu
  });

  // Đảm bảo video tự động phát khi component được mount hoặc uri thay đổi
  useEffect(() => {
    player.play();
  }, [player, uri]);

  return (
    <View style={[styles.container, style]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
