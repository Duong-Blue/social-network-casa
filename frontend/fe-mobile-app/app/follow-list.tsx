import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { getFollowersThunk, getFollowingThunk, followUserThunk, unfollowUserThunk } from '@/features/interaction/thunk/interaction.thunk';
import { getProfileThunk, getMyProfileThunk } from '@/features/account/thunk/account.thunk';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import { selectMyProfile, selectViewedProfile } from '@/features/account/selector/account.selector';

export default function FollowListScreen() {
    const { userId, initialTab } = useLocalSearchParams();
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const { followers, following, isLoading: isInteractionLoading } = useSelector((state: RootState) => state.interaction);
    const targetUserId = (userId as string) || currentUser?.userId;
    const isMe = String(targetUserId) === String(currentUser?.userId);
    const profile = useSelector(isMe ? selectMyProfile : selectViewedProfile); // Dùng để hiển thị tên chủ tài khoản trên Header

    const [activeTab, setActiveTab] = useState<'followers' | 'following'>((initialTab as 'followers' | 'following') || 'followers');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch dữ liệu tương ứng theo tab hoạt động
    const fetchData = useCallback(async () => {
        if (!targetUserId) return;
        if (activeTab === 'followers') {
            await dispatch(getFollowersThunk(targetUserId));
        } else {
            await dispatch(getFollowingThunk(targetUserId));
        }
    }, [dispatch, targetUserId, activeTab]);

    useEffect(() => {
        fetchData();
        // Đồng thời lấy thông tin profile để hiển thị tên trên header
        if (targetUserId) {
            if (isMe) {
                dispatch(getMyProfileThunk(targetUserId));
            } else {
                dispatch(getProfileThunk(targetUserId));
            }
        }
    }, [fetchData, targetUserId, isMe]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchData();
        setIsRefreshing(false);
    };

    // Xử lý follow/unfollow nhanh
    const handleFollowAction = async (itemUserId: string, isCurrentlyFollowing: boolean) => {
        if (!currentUser?.userId) return;
        
        try {
            if (isCurrentlyFollowing) {
                Alert.alert(
                    'Huỷ theo dõi',
                    'Bạn có muốn huỷ theo dõi người này không?',
                    [
                        { text: 'Hủy', style: 'cancel' },
                        {
                            text: 'Đồng ý',
                            style: 'destructive',
                            onPress: async () => {
                                await dispatch(unfollowUserThunk({
                                    followerId: currentUser.userId,
                                    followingId: itemUserId
                                })).unwrap();
                                // Refresh lại list
                                fetchData();
                            }
                        }
                    ]
                );
            } else {
                await dispatch(followUserThunk({
                    followerId: currentUser.userId,
                    followingId: itemUserId
                })).unwrap();
                // Refresh lại list
                fetchData();
            }
        } catch (error) {
            Alert.alert('Thất bại', 'Đã xảy ra lỗi, vui lòng thử lại sau.');
        }
    };

    const handleUserPress = (itemUserId: string) => {
        if (itemUserId === currentUser?.userId) {
            router.push('/(tab)/account');
        } else {
            router.push(`/user/${itemUserId}`);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const itemUserId = item.userId;
        const isMe = itemUserId === currentUser?.userId;
        // Kiểm tra xem mình (currentUser) có đang follow user này trong danh sách following của mình không
        const isCurrentlyFollowing = following?.some(f => String(f.userId) === String(itemUserId)) || false;

        const avatarUri = getMediaUrl(item.profilePicture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.username || 'U')}&background=random`;

        return (
            <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => handleUserPress(itemUserId)}
                className="flex-row items-center justify-between py-3 border-b border-slate-100 dark:border-white/5"
            >
                <View className="flex-row items-center gap-3 flex-1">
                    <Image
                        source={{ uri: avatarUri }}
                        className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800"
                        resizeMode="cover"
                    />
                    <Text className="text-slate-800 dark:text-white font-semibold text-base flex-1" numberOfLines={1}>
                        {item.username || 'Người dùng CASA'}
                    </Text>
                </View>

                {/* Nút follow nhanh (không hiển thị nếu item là chính mình) */}
                {!isMe && (
                    <TouchableOpacity
                        onPress={() => handleFollowAction(itemUserId, isCurrentlyFollowing)}
                        className={`px-4 py-1.5 rounded-lg border ${
                            isCurrentlyFollowing 
                                ? 'bg-slate-100 dark:bg-white/10 border-slate-200 dark:border-white/20' 
                                : 'bg-[#038eff] border-[#038eff]'
                        }`}
                        activeOpacity={0.8}
                    >
                        <Text className={`font-semibold text-xs ${isCurrentlyFollowing ? 'text-slate-600 dark:text-slate-300' : 'text-white'}`}>
                            {isCurrentlyFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                        </Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    const displayListName = activeTab === 'followers' ? 'Người theo dõi' : 'Đang theo dõi';
    const listData = activeTab === 'followers' ? followers : following;

    return (
        <View className="flex-1 bg-[#f7f6f8] dark:bg-[#0F0A1F]">
            <Stack.Screen options={{ headerShown: false }} />
            
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
                <Text className="text-lg font-bold text-slate-800 dark:text-white" numberOfLines={1}>
                    {profile?.username || 'Kết nối'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Custom Tab Selector */}
            <View className="flex-row bg-white dark:bg-[#0F0A1F] border-b border-slate-200/50 dark:border-white/5">
                <TouchableOpacity 
                    onPress={() => setActiveTab('followers')}
                    className="flex-1 py-4 items-center justify-center relative"
                >
                    <Text className={`font-bold text-sm ${activeTab === 'followers' ? 'text-[#038eff] dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        Người theo dõi
                    </Text>
                    {activeTab === 'followers' && (
                        <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#038eff] dark:bg-sky-400" />
                    )}
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setActiveTab('following')}
                    className="flex-1 py-4 items-center justify-center relative"
                >
                    <Text className={`font-bold text-sm ${activeTab === 'following' ? 'text-[#038eff] dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        Đang theo dõi
                    </Text>
                    {activeTab === 'following' && (
                        <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#038eff] dark:bg-sky-400" />
                    )}
                </TouchableOpacity>
            </View>

            {/* List Content */}
            <View className="flex-1 px-6">
                {isInteractionLoading && !isRefreshing ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#038eff" />
                    </View>
                ) : (
                    <FlatList
                        data={listData}
                        keyExtractor={(item) => item.userId}
                        renderItem={renderItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 40 }}
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        ListEmptyComponent={() => (
                            <View className="py-20 items-center justify-center gap-3">
                                <MaterialIcons 
                                    name={activeTab === 'followers' ? 'people-outline' : 'person-outline'} 
                                    size={48} 
                                    color={isDark ? '#475569' : '#CBD5E1'} 
                                />
                                <Text className="text-slate-400 dark:text-slate-500 text-sm">
                                    Không có người dùng nào trong danh sách
                                </Text>
                            </View>
                        )}
                    />
                )}
            </View>
        </View>
    );
}
