import React, { useState, useRef } from 'react';
import {
    View, Text, Image, TouchableOpacity,
    Animated, Platform, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { likePostThunk } from '@/features/interaction/thunk/interaction.thunk';
import { toggleSavePostThunk } from '@/features/post/thunk/post.thunk';
import { PostResponse } from '@/features/post/type/post.types';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import MentionText from '@/components/MentionText';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as Haptics from 'expo-haptics';
import MultiImageGrid from '@/screens/home/components/MultiImageGrid';

dayjs.extend(relativeTime);

/**
 * ProfileFeedItem — phiên bản nhẹ của PostItem dùng riêng trong ProfileGrid (feed mode).
 * KHÔNG dùng <Modal> để tránh lỗi "Couldn't find a navigation context"
 * khi render đồng loạt nhiều item trong ScrollView.
 */
export function ProfileFeedItem({ post }: { post: PostResponse }) {
    const dispatch = useAppDispatch();
    const { user: currentUser, isAuthenticated } = useAppSelector(state => state.auth);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [showComments, setShowComments] = useState(false);
    const likeScale = useRef(new Animated.Value(1)).current;

    const avatarUri = post.user.profilePicture
        ? getMediaUrl(post.user.profilePicture)
        : `https://ui-avatars.com/api/?name=${post.user.username}&background=random`;

    const requireAuth = (action: () => void) => {
        if (!isAuthenticated) {
            Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để sử dụng tính năng này');
            return;
        }
        action();
    };

    const handleLike = () => {
        requireAuth(() => {
            if (currentUser) {
                dispatch(likePostThunk({ postId: post.postId, userId: currentUser.userId }));
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Animated.sequence([
                    Animated.spring(likeScale, { toValue: 1.35, useNativeDriver: true, friction: 3 }),
                    Animated.spring(likeScale, { toValue: 1, useNativeDriver: true, friction: 3 }),
                ]).start();
            }
        });
    };

    const handleSave = () => {
        requireAuth(() => {
            dispatch(toggleSavePostThunk(post.postId));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        });
    };

    const hasMedia = post.mediaUrls && post.mediaUrls.some(url => url && url.trim() !== '');
    const validMedia = hasMedia ? post.mediaUrls.filter(url => url && url.trim() !== '') : [];

    return (
        <View
            className="mb-6 mx-4 rounded-2xl overflow-hidden"
            style={{
                backgroundColor: isDark ? '#2A0E4D' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                ...Platform.select({
                    ios: {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isDark ? 0.3 : 0.08,
                        shadowRadius: 12,
                    },
                    android: { elevation: 4 },
                }),
            }}
        >
            {/* ── Header ── */}
            <View className="flex-row items-center justify-between p-4 pb-2">
                <TouchableOpacity
                    className="flex-row items-center gap-3 flex-1"
                    onPress={() => { try { router.push(`/user/${post.user.userId}` as any); } catch {} }}
                >
                    <Image
                        source={{ uri: avatarUri }}
                        className="w-10 h-10 rounded-full"
                        style={{ borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }}
                        resizeMode="cover"
                    />
                    <View className="flex-1">
                        <Text className="text-sm font-bold text-slate-800 dark:text-white">{post.user.username}</Text>
                        <Text className="text-xs text-slate-500 dark:text-slate-400">
                            {dayjs(post.createdAt).fromNow()}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Navigate trực tiếp sang post detail */}
                <TouchableOpacity
                    onPress={() => { try { router.push(`/post/${post.postId}` as any); } catch {} }}
                    className="p-1 ml-2"
                >
                    <MaterialIcons name="more-horiz" size={24} color={isDark ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
            </View>

            {/* ── Media (Lưới ảnh MultiImageGrid) ── */}
            {validMedia.length > 0 && (
                <MultiImageGrid 
                    images={validMedia.map((url, index) => ({
                        id: `${post.postId}_img_${index}`,
                        url: url
                    }))}
                    onLikeDoubleTap={handleLike}
                />
            )}

            {/* ── Caption + Actions ── */}
            <View className="px-4 pb-4">
                {post.content ? (
                    <MentionText className="text-sm text-slate-700 dark:text-slate-200 leading-snug mt-4 mb-4">
                        {post.content}
                    </MentionText>
                ) : (
                    <View className="mt-3" />
                )}

                {/* Box bài viết gốc được lồng bên trong (Share Post) */}
                {post.sharedPost && (
                    <View 
                        className="mb-4 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40"
                        style={{ overflow: 'hidden' }}
                    >
                        {/* Header tác giả gốc */}
                        <View className="flex-row items-center gap-2 mb-3">
                            <Image 
                                source={{ uri: getMediaUrl(post.sharedPost.user?.profilePicture) || `https://ui-avatars.com/api/?name=${post.sharedPost.user?.username || 'U'}&background=7c3bed&color=fff` }}
                                className="w-7 h-7 rounded-full"
                            />
                            <View>
                                <Text className="text-xs font-bold text-slate-800 dark:text-white">
                                    {post.sharedPost.user?.username || 'Người dùng'}
                                </Text>
                                <Text className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {dayjs(post.sharedPost.createdAt).format('DD/MM/YYYY HH:mm')}
                                </Text>
                            </View>
                        </View>

                        {/* Nội dung bài viết gốc */}
                        {post.sharedPost.content ? (
                            <MentionText className="text-xs text-slate-700 dark:text-slate-300 leading-snug mb-3">
                                {post.sharedPost.content}
                            </MentionText>
                        ) : null}

                        {/* Media của bài viết gốc */}
                        {post.sharedPost.mediaUrls && post.sharedPost.mediaUrls.length > 0 && (
                            <View style={{ borderRadius: 12, overflow: 'hidden', marginTop: 4 }}>
                                <MultiImageGrid 
                                    images={post.sharedPost.mediaUrls.map((url: string) => ({ url }))} 
                                    onLikeDoubleTap={() => {}} 
                                />
                            </View>
                        )}
                    </View>
                )}

                {/* Actions Row */}
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-6">
                        {/* Like */}
                        <TouchableOpacity
                            onPress={handleLike}
                            activeOpacity={0.7}
                            className="flex-row items-center gap-1"
                        >
                            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                                <MaterialIcons
                                    name={post.liked ? 'favorite' : 'favorite-border'}
                                    size={26}
                                    color={post.liked ? '#F43F5E' : (isDark ? '#CBD5E1' : '#475569')}
                                />
                            </Animated.View>
                            <Text className={`text-sm font-medium ${post.liked ? 'text-[#F43F5E]' : 'text-slate-500 dark:text-slate-300'}`}>
                                {post.numberLike}
                            </Text>
                        </TouchableOpacity>

                        {/* Comment — navigate sang post detail để xem/gửi bình luận */}
                        <TouchableOpacity
                            onPress={() => { try { router.push(`/post/${post.postId}` as any); } catch {} }}
                            activeOpacity={0.7}
                            className="flex-row items-center gap-1"
                        >
                            <MaterialIcons
                                name="chat-bubble-outline"
                                size={24}
                                color={isDark ? '#CBD5E1' : '#475569'}
                            />
                            <Text className="text-sm font-medium text-slate-500 dark:text-slate-300">
                                {post.numberComment}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Save */}
                    <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
                        <MaterialIcons
                            name={post.isSaved ? 'bookmark' : 'bookmark-border'}
                            size={26}
                            color={post.isSaved ? '#8B5CF6' : (isDark ? '#CBD5E1' : '#475569')}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
