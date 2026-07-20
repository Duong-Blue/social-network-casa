import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { getAllPostsThunk } from '@/features/post/thunk/post.thunk';
import { PostResponse } from '@/features/post/type/post.types';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import { useFocusEffect } from 'expo-router';

export default function MasonryGrid() {
    const dispatch = useAppDispatch();
    const { posts, isLoading } = useAppSelector(state => state.post);

    useFocusEffect(
        React.useCallback(() => {
            dispatch(getAllPostsThunk({ page: 1, size: 20 }));
        }, [dispatch])
    );

    const mediaPosts = posts.filter(item => item.mediaUrls && item.mediaUrls.some(url => url && url.trim() !== ''));

    // Tách làm 2 cột
    const leftColumn = mediaPosts.filter((_, index) => index % 2 === 0);
    const rightColumn = mediaPosts.filter((_, index) => index % 2 !== 0);

    const renderPost = (item: PostResponse) => (
        <TouchableOpacity
            key={item.postId}
            activeOpacity={0.8}
            className="mb-4 rounded-3xl overflow-hidden relative bg-slate-200 dark:bg-[#1A1525]"
            style={{ minHeight: 150 }}
        >
            <Image
                source={{ uri: getMediaUrl(item.mediaUrls?.[0]) }}
                className="w-full h-full"
                style={{ aspectRatio: 1 }}
                resizeMode="cover"
            />

            {/* Icon ở góc phải trên cùng */}
            {item.mediaUrls && item.mediaUrls.length > 1 && (
                <View className="absolute top-3 right-3 bg-black/40 rounded-full p-1.5 backdrop-blur-md">
                    <MaterialIcons name="collections" size={14} color="white" />
                </View>
            )}
            
            <View className="absolute bottom-0 left-0 right-0 p-3 bg-black/20">
                <Text className="text-white text-[10px] font-bold" numberOfLines={1}>@{item.user.username}</Text>
            </View>
        </TouchableOpacity>
    );

    if (isLoading && posts.length === 0) {
        return (
            <View className="py-20 items-center justify-center">
                <ActivityIndicator color="#7c3bed" />
            </View>
        );
    }

    return (
        <View className="flex-row px-4 gap-4 pb-24">
            {/* Cột Left */}
            <View className="flex-1 flex-col">
                {leftColumn.map(renderPost)}
            </View>

            {/* Cột Right */}
            <View className="flex-1 flex-col">
                {rightColumn.map(renderPost)}
            </View>

            {mediaPosts.length === 0 && !isLoading && (
                <View className="absolute w-full py-20 items-center">
                    <Text className="text-slate-500 dark:text-slate-400">Không có bài viết nào.</Text>
                </View>
            )}
        </View>
    );
}
