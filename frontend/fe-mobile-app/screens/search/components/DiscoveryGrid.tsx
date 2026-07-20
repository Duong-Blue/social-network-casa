import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, Dimensions, Text, Image } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { getAllPostsThunk } from '@/features/post/thunk/post.thunk';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import { useFocusEffect } from 'expo-router';
import MediaThumbnail from '@/components/MediaThumbnail';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 40) / 3; // 3 columns with padding

export default function DiscoveryGrid() {
    const dispatch = useAppDispatch();
    const { posts, isLoading } = useAppSelector(state => state.post);
    useColorScheme();

    useFocusEffect(
        React.useCallback(() => {
            dispatch(getAllPostsThunk({ page: 1, size: 30 }));
        }, [dispatch])
    );

    if (isLoading && posts.length === 0) {
        return (
            <View className="py-20 items-center justify-center">
                <ActivityIndicator color="#7c3bed" />
            </View>
        );
    }

    const mediaPosts = posts.filter(item => item.mediaUrls && item.mediaUrls.some(url => url && url.trim() !== ''));

    // Nhóm bài viết thành các hàng 3 cột
    const rows = [];
    for (let i = 0; i < mediaPosts.length; i += 3) {
        rows.push(mediaPosts.slice(i, i + 3));
    }

    return (
        <View className="px-4 pb-24">
            <Text className="text-slate-800 dark:text-white text-base font-bold mb-4">Khám phá</Text>
            {rows.map((row, rowIndex) => (
                <View key={rowIndex} className="flex-row gap-2 mb-2">
                    {row.map((item) => (
                        <TouchableOpacity
                            key={item.postId}
                            activeOpacity={0.9}
                            className="rounded-xl overflow-hidden bg-slate-200 dark:bg-[#1A1525]"
                            style={{ width: ITEM_WIDTH, height: ITEM_WIDTH }}
                        >
                            <MediaThumbnail
                                url={item.mediaUrls?.[0] || ''}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                            {item.mediaUrls && item.mediaUrls.length > 1 && (
                                <View className="absolute top-1.5 right-1.5">
                                    <MaterialIcons name="collections" size={14} color="white" style={{ opacity: 0.8 }} />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                    {/* Fill empty slots in the last row to maintain grid */}
                    {row.length < 3 && Array(3 - row.length).fill(0).map((_, i) => (
                        <View key={`empty-${i}`} style={{ width: ITEM_WIDTH, height: ITEM_WIDTH }} />
                    ))}
                </View>
            ))}

            {mediaPosts.length === 0 && !isLoading && (
                <View className="py-20 items-center">
                    <Text className="text-slate-500 dark:text-slate-400">Không có bài viết nào.</Text>
                </View>
            )}
        </View>
    );
}
