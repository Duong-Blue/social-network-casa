import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import GlobalRefreshControl from '@/components/GlobalRefreshControl';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { getAllPostsThunk } from '@/features/post/thunk/post.thunk';
import { PostResponse } from '@/features/post/type/post.types';
import { useFocusEffect } from 'expo-router';
import { useColorScheme } from 'nativewind';
import StoryBar from './StoryBar';
import { PostItem } from './PostItem';
import { SkeletonPostCard } from './SkeletonPostCard';

export { PostItem } from './PostItem';

export default function MainFeed() {
    const dispatch = useAppDispatch();
    const { posts, isLoading, error, totalPages, currentPage } = useAppSelector(state => state.post);
    const [refreshing, setRefreshing] = useState(false);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [activePostId, setActivePostId] = useState<string | null>(null);

    const onViewableItemsChanged = useRef(({ viewableItems: items }: any) => {
        if (items && items.length > 0) {
            // Lấy bài viết đầu tiên hiển thị trên 60% màn hình làm active item
            const firstVisibleItem = items[0];
            if (firstVisibleItem) {
                setActivePostId(firstVisibleItem.key);
            }
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 60,
    }).current;

    const loadPosts = useCallback((page = 1) => {
        dispatch(getAllPostsThunk({ page, size: 10 }));
    }, [dispatch]);

    useFocusEffect(
        React.useCallback(() => {
            loadPosts(1);
        }, [loadPosts])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await dispatch(getAllPostsThunk({ page: 1, size: 10 }));
        setRefreshing(false);
    }, [dispatch]);

    const handleLoadMore = () => {
        if (!isLoading && currentPage + 1 < totalPages) {
            dispatch(getAllPostsThunk({ page: currentPage + 2, size: 10 }));
        }
    };

    const renderPost = useCallback(({ item }: { item: PostResponse }) => (
        <PostItem post={item} isActive={activePostId === item.postId.toString()} />
    ), [activePostId]);

    const renderFooter = () => {
        if (!isLoading) return <View className="h-20" />;
        return (
            <View className="py-8 items-center">
                <ActivityIndicator size="small" color="#8B5CF6" />
            </View>
        );
    };

    if (error && posts.length === 0) {
        return (
            <View className="flex-1 items-center justify-center py-10 px-4">
                <MaterialIcons name="error-outline" size={48} color={isDark ? '#F43F5E' : '#DC2626'} />
                <Text className="text-slate-600 dark:text-slate-400 text-sm mt-4 text-center">
                    Đã xảy ra lỗi khi tải bài viết
                </Text>
                <TouchableOpacity onPress={() => loadPosts(1)} className="mt-4 bg-primary px-6 py-3 rounded-xl">
                    <Text className="text-white font-bold">Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (isLoading && posts.length === 0) {
        return (
            <View className="flex-1">
                <StoryBar />
                <SkeletonPostCard />
                <SkeletonPostCard />
                <SkeletonPostCard />
            </View>
        );
    }

    return (
        <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.postId.toString()}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            ListHeaderComponent={<StoryBar />}
            ListFooterComponent={renderFooter}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
                <GlobalRefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            }
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
                !isLoading ? (
                    <View className="py-20 items-center px-4">
                        <MaterialIcons name="article" size={64} color={isDark ? '#475569' : '#CBD5E1'} />
                        <Text className="text-slate-400 dark:text-slate-500 mt-4 text-center">Chưa có bài viết nào.</Text>
                        <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1">Hãy là người đầu tiên đăng bài!</Text>
                    </View>
                ) : null
            }
        />
    );
}
