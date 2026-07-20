import "../global.css";
import { Provider } from "react-redux";
import { Stack } from "expo-router";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts, PublicSans_400Regular, PublicSans_500Medium, PublicSans_600SemiBold, PublicSans_700Bold } from "@expo-google-fonts/public-sans";
import { ActivityIndicator, Platform, Text, TextInput, View, Alert, Animated, StyleSheet } from "react-native";
import CustomAlertContainer, { customAlert } from "@/components/CustomAlert";

// Ghi đè Alert.alert của hệ thống bằng Custom Alert toàn cục
Alert.alert = (title, message, buttons, options) => {
  customAlert.alert(title || '', message, buttons, options);
};
import { store, persistor } from "@/store";
import { PersistGate } from "redux-persist/integration/react";
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { useEffect, useState, useRef } from "react";
import * as SplashScreen from "expo-splash-screen";
import SocketInitializer from "@/components/SocketInitializer";
import * as NavigationBar from 'expo-navigation-bar';
import { useColorScheme } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from 'expo-notifications';

// Cho phép hiển thị thông báo khi app ở foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Ngăn màn hình splash tự động ẩn trước khi load xong tài nguyên
SplashScreen.preventAutoHideAsync();

if (Platform.OS === 'android') {
  NavigationBar.setBehaviorAsync('overlay-swipe');
  NavigationBar.setVisibilityAsync('hidden');
  
  // Tự động ẩn lại sau 3 giây nếu người dùng vuốt lên để hiện thanh điều hướng
  NavigationBar.addVisibilityListener(({ visibility }) => {
    if (visibility === 'visible') {
      setTimeout(() => {
        NavigationBar.setVisibilityAsync('hidden');
      }, 3000);
    }
  });
}

// Tắt cảnh báo strict mode của Reanimated (do NativeWind v4 thường xuyên trigger)
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});


export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [themeLoaded, setThemeLoaded] = useState(false);
  
  const [fontsLoaded] = useFonts({
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
  });

  // Animated Splash state
  const [showSplash, setShowSplash] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;

  // 5 dots Y offsets
  const dot1Y = useRef(new Animated.Value(0)).current;
  const dot2Y = useRef(new Animated.Value(0)).current;
  const dot3Y = useRef(new Animated.Value(0)).current;
  const dot4Y = useRef(new Animated.Value(0)).current;
  const dot5Y = useRef(new Animated.Value(0)).current;

  // Dot jumping loop
  const startDotAnimation = (value: Animated.Value, delay: number) => {
    return Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, {
          toValue: -14,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.delay(400),
      ])
    );
  };

  // Tải theme từ AsyncStorage trước khi render
  useEffect(() => {
    const initTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("app_theme");
        if (savedTheme === "light" || savedTheme === "dark") {
          setColorScheme(savedTheme);
        } else {
          setColorScheme("dark");
          await AsyncStorage.setItem("app_theme", "dark");
        }
      } catch (e) {
        console.error("Failed to load theme:", e);
        setColorScheme("dark");
      } finally {
        setThemeLoaded(true);
      }
    };
    initTheme();
  }, []);

  // Điều chỉnh thanh điều hướng bên dưới của Android theo theme
  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setBackgroundColorAsync(colorScheme === 'dark' ? '#0F0A1F' : '#f7f6f8');
        NavigationBar.setButtonStyleAsync(colorScheme === 'dark' ? 'light' : 'dark');
      } catch (e) {
        console.log("Failed to configure Android NavigationBar theme:", e);
      }
    }
  }, [colorScheme]);

  // Yêu cầu quyền thông báo khi app khởi động
  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  useEffect(() => {
    if (fontsLoaded && themeLoaded) {
      // 1. Chạy các chấm nhảy và zoom logo
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        startDotAnimation(dot1Y, 0),
        startDotAnimation(dot2Y, 120),
        startDotAnimation(dot3Y, 240),
        startDotAnimation(dot4Y, 360),
        startDotAnimation(dot5Y, 480)
      ]).start();

      // 2. Ẩn SplashScreen cứng của OS
      SplashScreen.hideAsync();

      // 3. Chờ 3 giây rồi chạy hiệu ứng mờ dần (Fade Out)
      const timer = setTimeout(() => {
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setShowSplash(false);
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, themeLoaded]);

  if (!fontsLoaded || !themeLoaded) {
    return null;
  }

  // Android: dùng Public Sans, iOS: giữ SF Pro mặc định
  if (Platform.OS === "android") {
    const TextAny = Text as any;
    const TextInputAny = TextInput as any;

    TextAny.defaultProps ??= {};
    TextAny.defaultProps.style = [{ fontFamily: "PublicSans_400Regular" }, TextAny.defaultProps.style];

    TextInputAny.defaultProps ??= {};
    TextInputAny.defaultProps.style = [{ fontFamily: "PublicSans_400Regular" }, TextInputAny.defaultProps.style];
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SocketInitializer />
        <SafeAreaProvider>
          <SafeAreaView className="flex-1 bg-[#f7f6f8] dark:bg-[#0F0A1F]">
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tab)" />
            </Stack>
            <CustomAlertContainer />

            {showSplash && (
              <Animated.View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#0F0A1F' : '#f7f6f8',
                    opacity: splashOpacity,
                    zIndex: 99999,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }
                ]}
              >
                <Animated.Image
                  source={require("../assets/iconApp.png")}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 28,
                    opacity: logoOpacity,
                    transform: [{ scale: logoScale }],
                  }}
                  resizeMode="contain"
                />
                
                {/* 5 dots jumping loading animation */}
                <View className="flex-row items-center justify-center gap-2 mt-10" style={{ height: 30 }}>
                  {[dot1Y, dot2Y, dot3Y, dot4Y, dot5Y].map((dotY, i) => (
                    <Animated.View
                      key={i}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: i === 0 ? '#ac0d71' : i === 4 ? '#038eff' : '#7c3bed',
                        transform: [{ translateY: dotY }],
                      }}
                    />
                  ))}
                </View>
              </Animated.View>
            )}
          </SafeAreaView>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}
