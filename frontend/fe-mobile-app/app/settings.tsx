import React from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { logoutThunk } from '@/features/auth/thunk/auth.thunk';

export default function SettingsScreen() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { colorScheme, setColorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const handleToggleTheme = async () => {
        const nextTheme = colorScheme === 'dark' ? 'light' : 'dark';
        await AsyncStorage.setItem('app_theme', nextTheme);
        setTimeout(() => {
            setColorScheme(nextTheme);
        }, 0);
    };

    const handleLogout = () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất không?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dispatch(logoutThunk()).unwrap();
                            router.replace("/(auth)/login");
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View className="flex-1 bg-[#f7f6f8] dark:bg-[#0F0A1F]">
            <Stack.Screen options={{ headerShown: false }} />
            <View className="flex-1">

                {/* Header */}
                <View
                    className="flex-row items-center justify-between px-4 pb-3 border-b border-black/5 dark:border-white/10 bg-white dark:bg-[#0F0A1F]"
                    style={{ paddingTop: 10 }}
                >
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 active:opacity-75"
                    >
                        <Ionicons name="arrow-back" size={24} color={isDark ? 'white' : '#1E293B'} />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-slate-800 dark:text-white">Cài đặt tài khoản</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    className="flex-1 px-6 pt-6"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    {/* Section: Tài khoản */}
                    <View className="mb-6">
                        <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 ml-2">Tài khoản</Text>
                        <View className="bg-white dark:bg-[#1E192E] rounded-2xl p-2 border border-slate-200/50 dark:border-white/5 shadow-sm">

                            {/* Quản lý hồ sơ */}
                            <TouchableOpacity
                                onPress={() => router.push('/edit-profile')}
                                className="flex-row items-center justify-between p-4 active:opacity-75"
                            >
                                <View className="flex-row items-center gap-3 flex-1">
                                    <View className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 items-center justify-center">
                                        <Feather name="user" size={20} color="#8B5CF6" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-800 dark:text-white font-semibold text-base">Quản lý hồ sơ</Text>
                                        <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Thay đổi ảnh đại diện, tên, tiểu sử</Text>
                                    </View>
                                </View>
                                <MaterialIcons name="chevron-right" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
                            </TouchableOpacity>

                            <View className="h-[1px] bg-slate-100 dark:bg-white/5 mx-4" />

                            {/* Quản lý thông báo */}
                            <TouchableOpacity
                                onPress={() => router.push('/notification-settings')}
                                className="flex-row items-center justify-between p-4 active:opacity-75"
                            >
                                <View className="flex-row items-center gap-3 flex-1">
                                    <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                                        <Feather name="bell" size={20} color="#3B82F6" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-800 dark:text-white font-semibold text-base">Quản lý thông báo</Text>
                                        <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Tuỳ chỉnh các kênh nhận thông báo</Text>
                                    </View>
                                </View>
                                <MaterialIcons name="chevron-right" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Section: Hệ thống */}
                    <View className="mb-8">
                        <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 ml-2">Hệ thống</Text>
                        <View className="bg-white dark:bg-[#1E192E] rounded-2xl p-2 border border-slate-200/50 dark:border-white/5 shadow-sm">

                            {/* Giao diện tối */}
                            <View className="flex-row items-center justify-between p-4">
                                <View className="flex-row items-center gap-3 flex-1">
                                    <View className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-slate-800 items-center justify-center">
                                        <MaterialIcons
                                            name={isDark ? "dark-mode" : "light-mode"}
                                            size={20}
                                            color={isDark ? "#CBD5E1" : "#FBBF24"}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-800 dark:text-white font-semibold text-base">Chuyển đổi giao diện</Text>
                                        <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Chuyển đổi giữa giao diện Sáng và Tối</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={isDark}
                                    onValueChange={handleToggleTheme}
                                    trackColor={{ false: '#CBD5E1', true: '#c084fc' }}
                                    thumbColor={isDark ? '#7c3bed' : '#F1F5F9'}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Section: Đăng xuất */}
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20 py-4 rounded-2xl flex-row items-center justify-center active:opacity-75"
                    >
                        <MaterialIcons name="logout" size={20} color="#F43F5E" />
                        <Text className="text-[#F43F5E] font-bold text-base ml-2">Đăng xuất tài khoản</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    );
}
