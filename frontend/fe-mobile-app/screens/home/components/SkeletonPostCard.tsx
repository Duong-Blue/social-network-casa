import React, { useRef } from 'react';
import { View, Animated } from 'react-native';
import { useColorScheme } from 'nativewind';

export function SkeletonPostCard() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bg = isDark ? '#1E1445' : '#E8E4EF';
  const pulseAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const SkeletonBlock = ({ style }: any) => (
    <Animated.View style={[style, { opacity, backgroundColor: bg, borderRadius: 8 }]} />
  );

  return (
    <View className="mx-4 mb-6 rounded-2xl overflow-hidden" style={{ backgroundColor: isDark ? '#2A0E4D' : '#FFFFFF' }}>
      <View className="p-4 flex-row items-center gap-3">
        <SkeletonBlock style={{ width: 44, height: 44, borderRadius: 22 }} />
        <View className="flex-1 gap-2">
          <SkeletonBlock style={{ width: '40%', height: 12 }} />
          <SkeletonBlock style={{ width: '25%', height: 10 }} />
        </View>
      </View>
      <SkeletonBlock style={{ width: '100%', aspectRatio: 1 }} />
      <View className="p-4 gap-3">
        <SkeletonBlock style={{ width: '30%', height: 14 }} />
        <SkeletonBlock style={{ width: '60%', height: 12 }} />
      </View>
    </View>
  );
}
