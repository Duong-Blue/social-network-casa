import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export default function NotificationSettingsScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const { user } = useSelector((state: RootState) => state.auth);
    const isDark = colorScheme === 'dark';

    // State cho cấu hình thông báo
    const [notifSettings, setNotifSettings] = useState({
        messages: true,
        likes: true,
        comments: true,
        followers: true,
        stories: true
    });
    
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);

    // Key lưu settings cho mỗi user riêng biệt
    const settingsKey = user?.userId ? `notification_settings_${user.userId}` : null;

    useEffect(() => {
        const loadSettings = async () => {
            if (!settingsKey) {
                setIsLoadingSettings(false);
                return;
            }
            try {
                const stored = await AsyncStorage.getItem(settingsKey);
                if (stored) {
                    setNotifSettings(JSON.parse(stored));
                }
            } catch (error) {
                console.error('Lỗi khi tải cài đặt thông báo:', error);
            } finally {
                setIsLoadingSettings(false);
            }
        };

        loadSettings();
    }, [settingsKey]);

    const handleToggleSetting = async (key: keyof typeof notifSettings) => {
        if (!settingsKey) return;
        const newSettings = { ...notifSettings, [key]: !notifSettings[key] };
        setNotifSettings(newSettings);
        try {
            await AsyncStorage.setItem(settingsKey, JSON.stringify(newSettings));
        } catch (error) {
            console.error('Lỗi khi lưu cài đặt thông báo:', error);
        }
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
                    <Text className="text-lg font-bold text-slate-800 dark:text-white">Cài đặt thông báo</Text>
                    <View style={{ width: 40 }} />
                </View>

                {isLoadingSettings ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#7c3bed" />
                    </View>
                ) : (
                    <ScrollView 
                        className="flex-1 px-6 pt-6"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    >
                        <View className="bg-white dark:bg-[#1E192E] rounded-2xl p-2 border border-slate-200/50 dark:border-white/5 shadow-sm">
                            
                            {/* Thông báo tin nhắn */}
                            <View className="flex-row items-center justify-between p-4">
                                <View className="flex-row items-center gap-3 flex-1">
                                    <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                                        <MaterialIcons name="chat" size={20} color="#3B82F6" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-800 dark:text-white font-semibold text-base">Tin nhắn</Text>
                                        <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Nhận thông báo khi có tin nhắn mới</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={notifSettings.messages}
                                    onValueChange={() => handleToggleSetting('messages')}
                                    trackColor={{ false: '#CBD5E1', true: '#c084fc' }}
                                    thumbColor={notifSettings.messages ? '#7c3bed' : '#F1F5F9'}
                                />
                            </View>

                            <View className="h-[1px] bg-slate-100 dark:bg-white/5 mx-4" />

                            {/* Thông báo thả tim */}
                            <View className="flex-row items-center justify-between p-4">
                                <View className="flex-row items-center gap-3 flex-1">
                                    <View className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 items-center justify-center">
                                        <MaterialIcons name="favorite" size={20} color="#F43F5E" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-800 dark:text-white font-semibold text-base">Thả tim</Text>
                                        <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Nhận thông báo khi bài viết được thích</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={notifSettings.likes}
                                    onValueChange={() => handleToggleSetting('likes')}
                                    trackColor={{ false: '#CBD5E1', true: '#c084fc' }}
                                    thumbColor={notifSettings.likes ? '#7c3bed' : '#F1F5F9'}
                                />
                            </View>

                            <View className="h-[1px] bg-slate-100 dark:bg-white/5 mx-4" />

                            {/* Thông báo bình luận */}
                            <View className="flex-row items-center justify-between p-4">
                                <View className="flex-row items-center gap-3 flex-1">
                                    <View className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center">
                                        <MaterialIcons name="comment" size={20} color="#10B981" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-800 dark:text-white font-semibold text-base">Bình luận</Text>
                                        <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Nhận thông báo khi có bình luận mới</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={notifSettings.comments}
                                    onValueChange={() => handleToggleSetting('comments')}
                                    trackColor={{ false: '#CBD5E1', true: '#c084fc' }}
                                    thumbColor={notifSettings.comments ? '#7c3bed' : '#F1F5F9'}
                                />
                            </View>

                            <View className="h-[1px] bg-slate-100 dark:bg-white/5 mx-4" />

                            {/* Thông báo theo dõi mới */}
                            <View className="flex-row items-center justify-between p-4">
                                <View className="flex-row items-center gap-3 flex-1">
                                    <View className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 items-center justify-center">
                                        <MaterialIcons name="person-add" size={20} color="#8B5CF6" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-800 dark:text-white font-semibold text-base">Theo dõi</Text>
                                        <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Nhận thông báo khi có người theo dõi mới</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={notifSettings.followers}
                                    onValueChange={() => handleToggleSetting('followers')}
                                    trackColor={{ false: '#CBD5E1', true: '#c084fc' }}
                                    thumbColor={notifSettings.followers ? '#7c3bed' : '#F1F5F9'}
                                />
                            </View>

                            <View className="h-[1px] bg-slate-100 dark:bg-white/5 mx-4" />

                            {/* Thông báo story mới */}
                            <View className="flex-row items-center justify-between p-4">
                                <View className="flex-row items-center gap-3 flex-1">
                                    <View className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 items-center justify-center">
                                        <MaterialIcons name="play-circle-outline" size={20} color="#F59E0B" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-800 dark:text-white font-semibold text-base">Tin (Story)</Text>
                                        <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Nhận thông báo khi bạn bè đăng tin mới</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={notifSettings.stories}
                                    onValueChange={() => handleToggleSetting('stories')}
                                    trackColor={{ false: '#CBD5E1', true: '#c084fc' }}
                                    thumbColor={notifSettings.stories ? '#7c3bed' : '#F1F5F9'}
                                />
                            </View>
                        </View>
                    </ScrollView>
                )}
            </View>
        </View>
    );
}
