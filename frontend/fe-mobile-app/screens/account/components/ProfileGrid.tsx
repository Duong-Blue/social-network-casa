import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Dimensions, ActivityIndicator, Text, Image, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import MediaThumbnail from '@/components/MediaThumbnail';
import { getAllPostsByUserIdThunk, getSavedPostsThunk } from '@/features/post/thunk/post.thunk';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { ProfileFeedItem } from './ProfileFeedItem';

const { width } = Dimensions.get('window');
// Calculate 1/3 width with padding horizontal (16px * 2) and 2 gaps (4px * 2)
const itemSize = (width - 40) / 3;

export default function ProfileGrid({ userId }: { userId?: string }) {
    const dispatch = useAppDispatch();
    const { user: currentUser } = useAppSelector(state => state.auth);
    const { posts, userPosts, savedPosts, isLoading } = useAppSelector(state => state.post);
    const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
    const [layoutMode, setLayoutMode] = useState<'grid' | 'feed'>('grid');

    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const targetUserId = userId || currentUser?.userId;
    const isOwnProfile = String(targetUserId) === String(currentUser?.userId);

    const rawPosts = activeTab === 'posts' ? (targetUserId ? userPosts : posts) : savedPosts;

    const currentLayoutMode = layoutMode;

    // Nếu ở chế độ grid thì lọc bỏ các bài viết không chứa ảnh thực tế
    const displayPosts = currentLayoutMode === 'grid'
        ? rawPosts.filter(post => post.mediaUrls && post.mediaUrls.some(url => url && url.trim() !== ''))
        : rawPosts;

    console.log(`[ProfileGrid] userId prop: ${userId}, targetUserId: ${targetUserId}, isOwnProfile: ${isOwnProfile}, activeTab: ${activeTab}, layoutMode: ${layoutMode}, currentLayoutMode: ${currentLayoutMode}, filtered posts count: ${displayPosts.length}`);

    const loadPosts = useCallback(() => {
        if (activeTab === 'posts' && targetUserId) {
            dispatch(getAllPostsByUserIdThunk({ page: 1, size: 20, userId: targetUserId }));
        } else if (activeTab === 'saved' && isOwnProfile) {
            dispatch(getSavedPostsThunk({ page: 1, size: 20 }));
        }
    }, [dispatch, targetUserId, activeTab, isOwnProfile]);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    return (
        <View className="flex-1 w-full">
            {/* Content Tabs & Layout Switcher */}
            <View className="flex-row justify-between items-center border-b border-slate-200 dark:border-slate-800 px-6 py-3 bg-white dark:bg-[#1A1625]">
                {/* Left: Tabs or Title */}
                {isOwnProfile ? (
                    <View className="flex-row gap-6">
                        <TouchableOpacity
                            className="pb-1 relative"
                            onPress={() => setActiveTab('posts')}
                        >
                            <Text className={`font-bold text-sm ${activeTab === 'posts' ? 'text-[#7c40ed]' : 'text-slate-400 dark:text-slate-500'}`}>Bài viết</Text>
                            {activeTab === 'posts' && <View className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-[#7c40ed]" />}
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="pb-1 relative"
                            onPress={() => setActiveTab('saved')}
                        >
                            <Text className={`font-bold text-sm ${activeTab === 'saved' ? 'text-[#7c40ed]' : 'text-slate-400 dark:text-slate-500'}`}>Đã lưu</Text>
                            {activeTab === 'saved' && <View className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-[#7c40ed]" />}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text className="text-slate-800 dark:text-white font-bold text-base">Bài viết</Text>
                )}

                {/* Right: Layout Switcher */}
                <View
                    className="flex-row items-center rounded-full p-1 gap-1"
                    style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(148,163,184,0.6)',
                    }}
                >
                    <TouchableOpacity
                        className="p-1.5 rounded-full"
                        style={layoutMode === 'grid' ? {
                            backgroundColor: isDark ? '#1e293b' : '#FFFFFF',
                            ...Platform.select({
                                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
                                android: { elevation: 2 },
                            }),
                        } : {}}
                        onPress={() => setLayoutMode('grid')}
                    >
                        <MaterialIcons name="grid-on" size={16} color={layoutMode === 'grid' ? '#7c40ed' : '#94A3B8'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="p-1.5 rounded-full"
                        style={layoutMode === 'feed' ? {
                            backgroundColor: isDark ? '#1e293b' : '#FFFFFF',
                            ...Platform.select({
                                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
                                android: { elevation: 2 },
                            }),
                        } : {}}
                        onPress={() => setLayoutMode('feed')}
                    >
                        <MaterialIcons name="view-stream" size={16} color={layoutMode === 'feed' ? '#7c40ed' : '#94A3B8'} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Grid or Feed Content */}
            {currentLayoutMode === 'grid' ? (
                <View className="flex-row flex-wrap px-4 pt-4 pb-[80px] gap-1">
                    {displayPosts.map((post) => (
                        <TouchableOpacity
                            key={post.postId}
                            activeOpacity={0.8}
                            style={{ width: itemSize, height: itemSize, marginBottom: 4, backgroundColor: isDark ? '#1e293b' : '#E2E8F0' }}
                            className="relative overflow-hidden rounded-md"
                            onPress={() => {
                                try {
                                    router.push(`/post/${post.postId}` as any);
                                } catch { }
                            }}
                        >
                            <MediaThumbnail
                                url={post.mediaUrls?.[0] || ''}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                            {/* Overlay if Collection */}
                            {post.mediaUrls && post.mediaUrls.length > 1 && (
                                <View style={{ position: 'absolute', top: 8, right: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }}>
                                    <MaterialIcons name="layers" size={20} color="white" />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}

                    {displayPosts.length === 0 && !isLoading && (
                        <View className="w-full py-20 items-center">
                            <Text className="text-slate-400 dark:text-slate-500">Chưa có bài viết nào.</Text>
                        </View>
                    )}
                </View>
            ) : (
                <View className="pt-4 pb-[100px]">
                    {displayPosts.map((post) => (
                        <ProfileFeedItem key={post.postId} post={post} />
                    ))}

                    {displayPosts.length === 0 && !isLoading && (
                        <View className="w-full py-20 items-center">
                            <Text className="text-slate-400 dark:text-slate-500">Chưa có bài viết nào.</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Loading Indicator */}
            {isLoading && (
                <View className="justify-center items-center py-8 pb-32">
                    <ActivityIndicator size="large" color="#7c40ed" />
                </View>
            )}
        </View>
    );
}