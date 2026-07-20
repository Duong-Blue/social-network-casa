import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { getMyProfileThunk } from '@/features/account/thunk/account.thunk';
import { selectMyProfile } from '@/features/account/selector/account.selector';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import { useColorScheme } from "nativewind";
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileInfo({ userId }: { userId?: string }) {
    const dispatch = useDispatch<AppDispatch>();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const profile = useSelector(selectMyProfile);
    const { isLoading } = useSelector((state: RootState) => state.account);
    const stories = useSelector((state: RootState) => state.story.stories || []);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const targetUserId = userId || currentUser?.userId;

    // Kiểm tra bản thân có story chưa xem không
    const myStoryGroup = stories.find(g => String(g.userId) === String(targetUserId));
    const hasUnviewedStory = myStoryGroup
        ? myStoryGroup.stories.some(s => !s?.viewers?.includes(currentUser?.userId ?? ''))
        : false;

    // ── Fetch mỗi khi màn hình được focus ──
    useFocusEffect(
        React.useCallback(() => {
            if (targetUserId) {
                dispatch(getMyProfileThunk(targetUserId));
            }
        }, [dispatch, targetUserId])
    );

    // ── Loading skeleton ──
    if (isLoading && !profile) {
        return (
            <View className="flex-col items-center px-6 pt-4 pb-8 z-10 w-full">
                <View className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-800" />
                <View className="mt-4 w-40 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <View className="mt-2 w-56 h-4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </View>
        );
    }

    const displayUsername = profile?.username || currentUser?.username || 'Guest';
    const displayBio = profile?.bio?.trim() || null;
    const displayAvatar = getMediaUrl(profile?.profilePicture)
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayUsername)}&background=7c40ed&color=fff`;

    return (
        <View className="flex-col items-center px-6 pt-4 pb-8 z-10 w-full">

            {/* Avatar */}
            <View className="relative items-center justify-center">
                {hasUnviewedStory ? (
                    <LinearGradient
                        colors={['#1D4ED8', '#EF4444']}
                        start={{ x: 0, y: 1 }}
                        end={{ x: 1, y: 0 }}
                        style={{ padding: 3, borderRadius: 999 }}
                    >
                        <View style={{ padding: 3, borderRadius: 999, backgroundColor: isDark ? '#0F0A1F' : '#f7f6f8' }}>
                            <Image
                                source={{ uri: displayAvatar }}
                                style={{ width: 120, height: 120, borderRadius: 999 }}
                                resizeMode="cover"
                            />
                        </View>
                    </LinearGradient>
                ) : (
                    <View
                        style={{ width: 128, height: 128, borderRadius: 999, borderWidth: 2, borderColor: 'rgba(124,64,237,0.3)', padding: 4, alignItems: 'center', justifyContent: 'center' }}>
                        <View className="w-full h-full rounded-full border-2 border-slate-200 dark:border-[#161121] overflow-hidden">
                            <Image
                                source={{ uri: displayAvatar }}
                                className="w-full h-full rounded-full"
                                resizeMode="cover"
                            />
                        </View>
                    </View>
                )}
            </View>

            {/* Tên & Bio */}
            <View className="mt-4 items-center">
                <Text className="text-2xl font-bold text-slate-800 dark:text-white tracking-wide">{displayUsername}</Text>
                {displayBio ? (
                    <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium text-center px-4">{displayBio}</Text>
                ) : (
                    <Text className="text-slate-400 dark:text-slate-600 text-sm mt-1 italic">Chưa có tiểu sử</Text>
                )}
            </View>

            {/* Stats — số liệu thực từ API */}
            <View className="flex-row w-full justify-between items-center mt-8 px-4">
                <View className="flex-col items-center flex-1">
                    <Text className="text-xl font-bold text-slate-800 dark:text-white">{profile?.numberPost ?? 0}</Text>
                    <Text className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mt-1">Bài viết</Text>
                </View>
                <View className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                
                <TouchableOpacity 
                    className="flex-col items-center flex-1 active:opacity-75"
                    onPress={() => router.push({ pathname: '/follow-list', params: { userId: targetUserId, initialTab: 'followers' } })}
                >
                    <Text className="text-xl font-bold text-slate-800 dark:text-white">{profile?.numberFollower ?? 0}</Text>
                    <Text className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mt-1">Theo dõi tôi</Text>
                </TouchableOpacity>

                <View className="w-px h-8 bg-slate-200 dark:bg-slate-800" />

                <TouchableOpacity 
                    className="flex-col items-center flex-1 active:opacity-75"
                    onPress={() => router.push({ pathname: '/follow-list', params: { userId: targetUserId, initialTab: 'following' } })}
                >
                    <Text className="text-xl font-bold text-slate-800 dark:text-white">{profile?.numberFollowing ?? 0}</Text>
                    <Text className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mt-1">Đang theo dõi</Text>
                </TouchableOpacity>
            </View>


        </View>
    );
}
