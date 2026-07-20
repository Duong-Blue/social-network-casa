import React from 'react';
import { useRouter, useSegments, withLayoutContext } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, Pressable, Alert, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Svg, { Path } from 'react-native-svg';

import { useColorScheme } from 'nativewind';

const TabNavigator = createMaterialTopTabNavigator();
export const MaterialTopTabs = withLayoutContext(TabNavigator.Navigator);

const TAB_ORDER = ['index', 'search', 'create-post', 'chat', 'account'] as const;
type TabName = (typeof TAB_ORDER)[number];

export default function TabLayout() {
  const segments = useSegments();
  const router = useRouter();

  const [pendingTab, setPendingTab] = useState<TabName | null>(null);
  const isNavigatingRef = useRef(false);

  const current = ((segments as string[])[1] as TabName | undefined) ?? 'index';
  const currentIndex = TAB_ORDER.indexOf(current);

  useEffect(() => {
    setPendingTab(null);
    isNavigatingRef.current = false;
  }, [current]);

  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const handleTabPress = (target: TabName) => {
    if (target === current) return;
    if (isNavigatingRef.current) return;

    // Các tab cần đăng nhập
    const protectedTabs: TabName[] = ['create-post', 'chat', 'account'];
    if (protectedTabs.includes(target) && !isAuthenticated) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập để sử dụng tính năng này',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') }
        ]
      );
      return;
    }

    isNavigatingRef.current = true;
    setPendingTab(target);

    const pathname =
      (target === 'index' ? '/(tab)' : `/(tab)/${target}`) as any;

    router.replace(pathname);

    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 350);
  };


  return (
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F0A1F]">
      <MaterialTopTabs
        tabBar={() => null}
        screenOptions={{
          swipeEnabled: isAuthenticated,
          lazy: true,
        }}
      >
        <MaterialTopTabs.Screen name="index" />
        <MaterialTopTabs.Screen name="search" />
        <MaterialTopTabs.Screen name="create-post" />
        <MaterialTopTabs.Screen name="chat" />
        <MaterialTopTabs.Screen name="account" />
      </MaterialTopTabs>

      <BottomBar currentTab={pendingTab ?? current} onTabPress={handleTabPress} />
    </View>
  );
}

type BottomBarProps = {
  currentTab: TabName;
  onTabPress: (tab: TabName) => void;
};

function BottomBar({ currentTab, onTabPress }: BottomBarProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width: screenWidth } = Dimensions.get('window');

  // Chiều rộng thanh lơ lửng: lấy 92% chiều rộng màn hình, giới hạn max-width 448px
  const barWidth = Math.min(screenWidth * 0.92, 448);
  const h = 56; // Hạ thấp độ cao nền Tab Bar xuống 56px cho thon gọn hơn
  const cr = 28; // Bán kính bo tròn góc ngoài (bằng nửa chiều cao)
  const center = barWidth / 2;
  const r_notch = 30; // Bán kính vòng khuyết ôm khít hơn
  const depth = 34; // Đường khuyết lõm sâu hơn xuống 30px

  // Vẽ đường Path cho thanh lơ lửng khuyết giữa và bo tròn 2 đầu
  const d = `
    M ${cr} 0
    L ${center - r_notch - 8} 0
    C ${center - r_notch - 2} 0, ${center - r_notch + 4} ${depth}, ${center} ${depth}
    C ${center + r_notch - 4} ${depth}, ${center + r_notch + 2} 0, ${center + r_notch + 8} 0
    L ${barWidth - cr} 0
    A ${cr} ${cr} 0 0 1 ${barWidth} ${cr}
    L ${barWidth} ${h - cr}
    A ${cr} ${cr} 0 0 1 ${barWidth - cr} ${h}
    L ${cr} ${h}
    A ${cr} ${cr} 0 0 1 0 ${h - cr}
    L 0 ${cr}
    A ${cr} ${cr} 0 0 1 ${cr} 0
    Z
  `;

  return (
    <View
      className="absolute bottom-6 left-0 right-0 items-center"
      pointerEvents="box-none"
    >
      <View
        style={{
          width: barWidth,
          height: h,
          position: 'relative',
        }}
        pointerEvents="box-none"
      >
        {/* Nền SVG vẽ thanh lơ lửng khuyết kèm shadow và border */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: barWidth,
            height: h,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.4 : 0.08,
            shadowRadius: 16,
            elevation: 8,
          }}
          pointerEvents="none"
        >
          <Svg width={barWidth} height={h}>
            <Path
              d={d}
              fill={isDark ? '#1C162E' : '#FFFFFF'}
              stroke={isDark ? '#2E2840' : '#E2E8F0'}
              strokeWidth={1}
            />
          </Svg>
        </View>

        {/* Các tab items */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: barWidth,
            height: h,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
          }}
          pointerEvents="box-none"
        >
          <TabItem
            icon="home"
            active={currentTab === 'index'}
            onPress={() => onTabPress('index')}
          />
          <TabItem
            icon="search"
            active={currentTab === 'search'}
            onPress={() => onTabPress('search')}
          />

          {/* Khoảng trống ở giữa chừa cho nút tạo */}
          <View style={{ width: 64 }} pointerEvents="none" />

          <TabItem
            icon="chat-bubble"
            active={currentTab === 'chat'}
            onPress={() => onTabPress('chat')}
          />
          <TabItem
            icon="person"
            active={currentTab === 'account'}
            onPress={() => onTabPress('account')}
          />
        </View>

        {/* Nút cộng (+) nổi lơ lửng khớp với vòng khuyết */}
        <View
          style={{
            position: 'absolute',
            top: -18, // Căn giữa nút cao 48px trên mép trên tabbar (48 / 2 = 24)
            left: center - 24, // Căn giữa theo chiều ngang
            width: 48,
            height: 48,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onTabPress('create-post')}
            className="w-full h-full rounded-full items-center justify-center"
            style={{
              backgroundColor: '#038eff', // Màu xanh dương CASA giống logo
              shadowColor: '#038eff',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <MaterialIcons name="add" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

type TabItemProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  active: boolean;
  onPress: () => void;
};

function TabItem({ icon, active, onPress }: TabItemProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const activeColor = '#038eff'; // Màu xanh dương của tab active
  const inactiveColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center w-10 h-10"
    >
      <MaterialIcons
        name={icon}
        size={26} // Cân chỉnh lại size icon là 26 cho vừa vặn với chiều cao 56px của tabbar
        color={active ? activeColor : inactiveColor}
      />
    </Pressable>
  );
}
