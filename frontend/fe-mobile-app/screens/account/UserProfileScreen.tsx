import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { getProfileThunk } from '@/features/account/thunk/account.thunk';
import { selectViewedProfile } from '@/features/account/selector/account.selector';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import ProfileGrid from './components/ProfileGrid';
import { followUserThunk, unfollowUserThunk, getFollowingThunk } from '@/features/interaction/thunk/interaction.thunk';
import { optimisticFollow, optimisticUnfollow } from '@/features/interaction/slice/interaction.slice';
import { clearViewedProfile } from '@/features/account/slice/account.slice';
import { createConversationThunk } from '@/features/chat/thunk/chat.thunk';
import { useColorScheme } from "nativewind";
import { getAllPostsByUserIdThunk } from '@/features/post/thunk/post.thunk';
import GlobalRefreshControl from '@/components/GlobalRefreshControl';

export default function UserProfileScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const profile = useSelector(selectViewedProfile);
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const { following, isFollowLoading } = useSelector((state: RootState) => state.interaction);
    const stories = useSelector((state: RootState) => state.story.stories || []);

    // Debounce: chặn double-click
    const isActionInProgress = useRef(false);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        if (!id) return;
        setRefreshing(true);
        const targetId = id as string;
        try {
            const promises: Promise<any>[] = [
                dispatch(getProfileThunk(targetId)).unwrap(),
                dispatch(getAllPostsByUserIdThunk({ page: 1, size: 20, userId: targetId })).unwrap()
            ];
            if (currentUser?.userId) {
                promises.push(dispatch(getFollowingThunk(currentUser.userId)).unwrap());
            }
            await Promise.all(promises);
        } catch (error) {
            console.error('Failed to refresh user profile:', error);
        } finally {
            setRefreshing(false);
        }
    }, [dispatch, id, currentUser?.userId]);

    useEffect(() => {
        if (id) {
            dispatch(getProfileThunk(id as string));
        }
        return () => {
            dispatch(clearViewedProfile());
        };
    }, [dispatch, id]);

    useEffect(() => {
        if (currentUser?.userId) {
            dispatch(getFollowingThunk(currentUser.userId));
        }
    }, [dispatch, currentUser?.userId]);

    const isMe = String(currentUser?.userId) === String(id);
    const isFollowing = following?.some(f => String(f.userId) === String(id)) || false;

    // Kiểm tra user đó có story chưa xem không
    const userStoryGroup = stories.find(g => String(g.userId) === String(id));
    const hasUnviewedStory = userStoryGroup
        ? userStoryGroup.stories.some(s => !s?.viewers?.includes(currentUser?.userId ?? ''))
        : false;

    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    // ── Optimistic update + debounce ──
    const handleFollow = useCallback(async () => {
        if (!currentUser || !id || isActionInProgress.current || isFollowLoading) return;
        isActionInProgress.current = true;

        const targetId = id as string;

        try {
            if (isFollowing) {
                // Optimistic: xóa khỏi following ngay lập tức
                dispatch(optimisticUnfollow(targetId));
                const result = await dispatch(unfollowUserThunk({
                    followerId: currentUser.userId,
                    followingId: targetId,
                }));
                // Nếu thất bại, rollback đã được xử lý trong slice
                if (unfollowUserThunk.rejected.match(result)) {
                    // Rollback handled in slice
                }
            } else {
                // Optimistic: thêm vào following ngay lập tức
                dispatch(optimisticFollow(targetId));
                const result = await dispatch(followUserThunk({
                    followerId: currentUser.userId,
                    followingId: targetId,
                }));
                // Nếu thất bại, rollback đã được xử lý trong slice
                if (followUserThunk.rejected.match(result)) {
                    // Rollback handled in slice
                }
            }
            // Refetch profile để cập nhật số liệu thống kê
            dispatch(getProfileThunk(targetId));
        } finally {
            isActionInProgress.current = false;
        }
    }, [currentUser, id, isFollowing, isFollowLoading, dispatch]);

    const handleMessage = async () => {
        if (!currentUser || !id) return;

        try {
            const result = await dispatch(createConversationThunk({
                user1Id: currentUser.userId,
                user2Id: id as string
            })).unwrap();

            console.log('📩 Create conversation result:', JSON.stringify(result));

            // MongoDB _id có thể là ObjectId hoặc string
            const conversationId = result?._id?.toString?.() || result?._id;

            if (conversationId) {
                router.push(`/chat/${conversationId}`);
            } else {
                console.error('❌ No conversation _id in result:', result);
            }
        } catch (error: any) {
            console.error('❌ Failed to create conversation:', JSON.stringify(error));
        }
    };

    return (
        <View className="flex-1 bg-[#f7f6f8] dark:bg-[#0F0A1F] relative overflow-hidden">
            {/* Background Glow Effects */}
            <View className="absolute -top-20 -left-20 w-64 h-64 bg-[#7c40ed]/10 dark:bg-[#7c40ed]/20 rounded-full" style={{ filter: 'blur(100px)' } as any} pointerEvents="none" />
            <View className="absolute top-40 -right-20 w-72 h-72 bg-[#06b6d4]/5 dark:bg-[#06b6d4]/10 rounded-full" style={{ filter: 'blur(100px)' } as any} pointerEvents="none" />

            {/* Header Navigation */}
            <View 
                className="flex-row items-center justify-between px-4 pb-3 border-b border-black/5 dark:border-white/10"
                style={{ paddingTop: 10 }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full items-center justify-center bg-slate-200/60 dark:bg-white/10"
                >
                    <Ionicons name="arrow-back" size={24} color={colorScheme === 'dark' ? 'white' : '#1E293B'} />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-slate-800 dark:text-white">{profile?.username || 'Hồ sơ'}</Text>
                <View className="w-10" />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
                refreshControl={
                    <GlobalRefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                {/* Profile Info Section */}
                <View className="flex-col items-center px-6 pt-4 pb-8 z-10 w-full">
                    <View className="relative group items-center justify-center">
                        {hasUnviewedStory ? (
                            <LinearGradient
                                colors={['#1D4ED8', '#EF4444']}
                                start={{ x: 0, y: 1 }}
                                end={{ x: 1, y: 0 }}
                                style={{ padding: 3, borderRadius: 999 }}
                            >
                                <View style={{ padding: 3, borderRadius: 999, backgroundColor: isDark ? '#0F0A1F' : '#f7f6f8' }}>
                                    <Image
                                        source={{ uri: getMediaUrl(profile?.profilePicture) || `https://ui-avatars.com/api/?name=${profile?.username || 'U'}&background=random` }}
                                        style={{ width: 120, height: 120, borderRadius: 999 }}
                                        resizeMode="cover"
                                    />
                                </View>
                            </LinearGradient>
                        ) : (
                            <View className="w-32 h-32 rounded-full border-2 border-primary/30 p-[4px] items-center justify-center">
                                <View className="w-full h-full rounded-full border-2 border-slate-200 dark:border-[#161121] bg-transparent overflow-hidden">
                                    <Image
                                        source={{ uri: getMediaUrl(profile?.profilePicture) || `https://ui-avatars.com/api/?name=${profile?.username || 'U'}&background=random` }}
                                        className="w-full h-full rounded-full"
                                        resizeMode="cover"
                                    />
                                </View>
                            </View>
                        )}
                    </View>

                    <View className="mt-4 items-center">
                        <Text className="text-2xl font-bold text-slate-800 dark:text-white tracking-wide">{profile?.username || 'Loading...'}</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">{profile?.bio || 'Người dùng AppCasa'}</Text>
                    </View>

                    {/* Stats */}
                    <View className="flex-row w-full justify-between items-center mt-8 px-4">
                        <View className="flex-col items-center flex-1">
                            <Text className="text-xl font-bold text-slate-800 dark:text-white">{profile?.numberPost ?? 0}</Text>
                            <Text className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mt-1">Bài viết</Text>
                        </View>
                        <View className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                        
                        <TouchableOpacity 
                            className="flex-col items-center flex-1 active:opacity-75"
                            onPress={() => router.push({ pathname: '/follow-list', params: { userId: id, initialTab: 'followers' } })}
                        >
                            <Text className="text-xl font-bold text-slate-800 dark:text-white">{profile?.numberFollower ?? 0}</Text>
                            <Text className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mt-1">Người theo dõi</Text>
                        </TouchableOpacity>

                        <View className="w-px h-8 bg-slate-200 dark:bg-slate-800" />

                        <TouchableOpacity 
                            className="flex-col items-center flex-1 active:opacity-75"
                            onPress={() => router.push({ pathname: '/follow-list', params: { userId: id, initialTab: 'following' } })}
                        >
                            <Text className="text-xl font-bold text-slate-800 dark:text-white">{profile?.numberFollowing ?? 0}</Text>
                            <Text className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mt-1">Đang theo dõi</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Action Buttons */}
                    {!isMe && (
                        <View className="flex-row gap-3 w-full mt-8">
                            {/* ── Follow Button với optimistic UI + loading indicator ── */}
                            <TouchableOpacity
                                className={`flex-1 py-3 rounded-xl items-center justify-center flex-row gap-2 ${
                                    isFollowing
                                        ? 'bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/20'
                                        : 'bg-[#7c40ed]'
                                } ${isFollowLoading ? 'opacity-70' : ''}`}
                                onPress={handleFollow}
                                disabled={isFollowLoading}
                                activeOpacity={0.75}
                            >
                                {isFollowLoading ? (
                                    <ActivityIndicator size="small" color={colorScheme === 'dark' ? 'white' : '#1E293B'} />
                                ) : (
                                    <MaterialIcons
                                        name={isFollowing ? 'person-remove' : 'person-add'}
                                        size={18}
                                        color={isFollowing ? (colorScheme === 'dark' ? 'white' : '#1E293B') : 'white'}
                                    />
                                )}
                                <Text className={isFollowing ? 'text-slate-800 dark:text-white font-bold' : 'text-white font-bold'}>
                                    {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="flex-1 py-3 rounded-xl bg-slate-200 dark:bg-white/10 items-center justify-center border border-slate-300 dark:border-white/10 flex-row gap-2"
                                onPress={handleMessage}
                                activeOpacity={0.75}
                            >
                                <MaterialIcons name="chat-bubble-outline" size={18} color={colorScheme === 'dark' ? 'white' : '#1E293B'} />
                                <Text className="text-slate-800 dark:text-white font-bold">Nhắn tin</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Posts Grid */}
                <ProfileGrid userId={id as string} />
            </ScrollView>
        </View>
    );
}
