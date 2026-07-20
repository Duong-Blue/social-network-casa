import React, { useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { getPostByIdThunk } from '@/features/post/thunk/post.thunk';
import { PostItem } from '@/screens/home/components/MainFeed';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PostDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const { currentPost, isLoading, error } = useAppSelector(state => state.post);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const loadPost = useCallback(() => {
        if (id) {
            dispatch(getPostByIdThunk(id as string));
        }
    }, [dispatch, id]);

    useEffect(() => {
        loadPost();
    }, [loadPost]);

    return (
        <View className="flex-1 bg-[#f7f6f8] dark:bg-[#0F0A1F]">
            {/* Header Navigation */}
            <View 
                className="flex-row items-center justify-between px-4 pb-4"
                style={{
                    paddingTop: 12,
                    backgroundColor: isDark ? '#1A1625' : '#FFFFFF',
                    borderBottomWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                }}
            >
                <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full active:bg-slate-200 dark:active:bg-white/10">
                    <MaterialIcons name="arrow-back" size={24} color={isDark ? 'white' : 'black'} />
                </TouchableOpacity>
                <Text className="text-base font-bold text-slate-800 dark:text-white">Chi tiết bài viết</Text>
                <View className="w-10" />
            </View>

            {/* Content Area */}
            {isLoading && !currentPost && (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#8B5CF6" />
                </View>
            )}

            {error && !currentPost && (
                <View className="flex-1 items-center justify-center py-10 px-4">
                    <MaterialIcons name="error-outline" size={48} color={isDark ? '#F43F5E' : '#DC2626'} />
                    <Text className="text-slate-650 dark:text-slate-400 text-sm mt-4 text-center">
                        Không thể tải thông tin bài viết
                    </Text>
                    <TouchableOpacity onPress={loadPost} className="mt-4 bg-primary px-6 py-3 rounded-xl">
                        <Text className="text-white font-bold">Thử lại</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!isLoading && !currentPost && !error && (
                <View className="flex-1 items-center justify-center py-10 px-4">
                    <MaterialIcons name="info-outline" size={48} color="#94A3B8" />
                    <Text className="text-slate-500 mt-4 text-center">Bài viết không tồn tại hoặc đã bị xóa</Text>
                </View>
            )}

            {currentPost && (
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 16, paddingBottom: 100 }}
                >
                    <PostItem post={currentPost} />
                </ScrollView>
            )}
        </View>
    );
}
