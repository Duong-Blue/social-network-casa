import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Animated, StyleSheet, StatusBar, ActivityIndicator, Image, Modal, Pressable, FlatList, Platform, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppSelector, useAppDispatch } from '@/store/hook';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import { storyService } from '@/features/story/service/story.service';
import { deleteStoryThunk, reactStoryThunk } from '@/features/story/thunk/story.thunk';
import { apiClient } from '@/utils/helpers/api_helper';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 giây mỗi story

export default function ViewStoryScreen() {
    const { userId, username, profilePicture } = useLocalSearchParams<{ 
        userId: string;
        username?: string;
        profilePicture?: string;
    }>();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user: currentUser, isAuthenticated } = useAppSelector(state => state.auth);
    const { stories } = useAppSelector(state => state.story);
    const { following = [] } = useAppSelector(state => state.interaction);

    const group = stories.find(s => s.userId === userId);
    const userStories = group?.stories || [];
    
    // Tìm thông tin user đăng story
    const isCurrentUser = userId === currentUser?.userId;
    const authorFromFollowing = following.find(f => f.userId === userId);
    const author = isCurrentUser 
        ? currentUser 
        : (authorFromFollowing || { 
            userId, 
            username: username || 'User', 
            profilePicture: profilePicture || '' 
          });

    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const progress = useRef(new Animated.Value(0)).current;

    // Viewers list state
    const [showViewers, setShowViewers] = useState(false);
    const [viewersList, setViewersList] = useState<any[]>([]);
    const [loadingViewers, setLoadingViewers] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const currentStory = userStories[currentIndex];

    // Tải thông tin viewers chi tiết
    useEffect(() => {
        if (showViewers && currentStory?.viewers && currentStory.viewers.length > 0) {
            setLoadingViewers(true);
            const fetchViewers = async () => {
                try {
                    const promises = currentStory.viewers.map(async (vId) => {
                        try {
                            const res = await apiClient.get(`/user/${vId}/profile`);
                            return res.data?.data || { userId: vId, username: 'User ẩn danh' };
                        } catch (e) {
                            return { userId: vId, username: 'User ẩn danh' };
                        }
                    });
                    const results = await Promise.all(promises);
                    setViewersList(results);
                } catch (err) {
                    console.log('Fetch viewers err', err);
                } finally {
                    setLoadingViewers(false);
                }
            };
            fetchViewers();
        } else {
            setViewersList([]);
        }
    }, [showViewers, currentStory]);

    useEffect(() => {
        if (userStories.length === 0) {
            router.back();
            return;
        }

        const activeStory = userStories[currentIndex];

        // Reset trạng thái ảnh mỗi khi chuyển story
        setImageLoading(true);
        setImageError(false);
        
        // Đánh dấu đã xem nếu chưa xem
        if (currentUser?.userId && !activeStory.viewers?.includes(currentUser.userId)) {
            storyService.markAsViewed(activeStory._id, currentUser.userId).catch(err => console.log('View err', err));
        }

        if (isPaused) {
            progress.stopAnimation();
            return;
        }

        // Bắt đầu chạy Progress Bar
        progress.setValue(0);
        Animated.timing(progress, {
            toValue: 1,
            duration: STORY_DURATION,
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished) {
                goToNextStory();
            }
        });

        return () => {
            progress.stopAnimation();
        };
    }, [currentIndex, userStories, isPaused]);

    const goToNextStory = () => {
        if (currentIndex < userStories.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            router.back(); // Nếu hết story thì đóng
        }
    };

    const goToPrevStory = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        } else {
            // Quay lại từ đầu tin đầu tiên
            progress.setValue(0);
            Animated.timing(progress, {
                toValue: 1,
                duration: STORY_DURATION,
                useNativeDriver: false,
            }).start(({ finished }) => {
                if (finished) goToNextStory();
            });
        }
    };

    const handleDeleteStory = () => {
        setIsPaused(true);
        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa tin này không?',
            [
                { text: 'Hủy', style: 'cancel', onPress: () => setIsPaused(false) },
                { 
                    text: 'Xóa', 
                    style: 'destructive', 
                    onPress: async () => {
                        try {
                            if (currentUser?.userId) {
                                await dispatch(deleteStoryThunk({ storyId: currentStory._id, userId: currentUser.userId })).unwrap();
                                if (userStories.length > 1) {
                                    setIsPaused(false);
                                    if (currentIndex > 0) {
                                        setCurrentIndex(prev => prev - 1);
                                    } else {
                                        setCurrentIndex(0);
                                    }
                                } else {
                                    router.back();
                                }
                            }
                        } catch (err) {
                            Alert.alert('Lỗi', 'Không thể xóa story');
                            setIsPaused(false);
                        }
                    } 
                }
            ]
        );
    };

    const handleReactStory = async (emoji: string) => {
        if (!currentUser?.userId) return;
        setIsPaused(true);
        try {
            await dispatch(reactStoryThunk({ storyId: currentStory._id, userId: currentUser.userId, emoji })).unwrap();
            Alert.alert('Thành công', `Bạn đã thả cảm xúc ${emoji} cho story này!`, [
                { text: 'OK', onPress: () => setIsPaused(false) }
            ]);
        } catch (err: any) {
            Alert.alert('Lỗi', 'Không thể thả cảm xúc');
            setIsPaused(false);
        }
    };

    if (userStories.length === 0) return null;

    const avatarUri = author?.profilePicture 
        ? getMediaUrl(author.profilePicture) 
        : `https://ui-avatars.com/api/?name=${author?.username || 'U'}&background=random&color=fff`;

    const isDark = true; // Xem story ở nền tối (Dark) hoàn toàn để tạo trải nghiệm rạp chiếu phim

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            
            {/* Vùng xem ảnh/video */}
            {imageError ? (
                <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
                    <MaterialIcons name="broken-image" size={54} color="#475569" />
                    <Text style={{ color: '#94A3B8', marginTop: 10, fontSize: 14 }}>
                        Không thể tải ảnh
                    </Text>
                </View>
            ) : (
                <Image
                    source={{ uri: getMediaUrl(currentStory.mediaUrl) }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                    onLoadStart={() => setImageLoading(true)}
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                        setImageLoading(false);
                        setImageError(true);
                    }}
                />
            )}

            {imageLoading && !imageError && (
                <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
                    <ActivityIndicator size="large" color="#ffffff" />
                </View>
            )}

            {/* Lớp mờ ở trên để chữ dễ đọc */}
            <View className="absolute top-0 w-full h-32 bg-black/30" />

            {/* Thanh Progress */}
            <View className="absolute top-12 w-full px-2 flex-row justify-between z-10 space-x-1">
                {userStories.map((_, index) => (
                    <View key={index} className="flex-1 h-1 bg-white/30 rounded-full mx-0.5 overflow-hidden">
                        <Animated.View 
                            style={{
                                flex: 1,
                                backgroundColor: 'white',
                                width: index === currentIndex 
                                    ? progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                                    : index < currentIndex ? '100%' : '0%'
                            }} 
                        />
                    </View>
                ))}
            </View>

            {/* Header thông tin người dùng */}
            <View className="absolute top-16 left-0 w-full px-4 flex-row items-center justify-between z-10">
                <View className="flex-row items-center gap-3">
                    <Image source={{ uri: avatarUri }} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }} resizeMode="cover" />
                    <View>
                        <Text className="text-white font-bold text-sm">{author?.username || 'User'}</Text>
                        <View className="flex-row items-center gap-1.5 mt-0.5">
                            <Text className="text-white/70 text-[10px]">{dayjs(currentStory.createdAt).fromNow()}</Text>
                            {currentStory.reactions && currentStory.reactions.length > 0 && (
                                <View className="flex-row items-center bg-white/20 px-1.5 py-0.5 rounded-full">
                                    <Text className="text-[10px] text-white">
                                        {Array.from(new Set(currentStory.reactions.map(r => r.emoji))).join('')} {currentStory.reactions.length}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                <View className="flex-row items-center gap-1">
                    {isCurrentUser && (
                        <TouchableOpacity onPress={handleDeleteStory} className="p-2 mr-1">
                            <Ionicons name="trash-outline" size={24} color="#F43F5E" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => router.back()} className="p-2">
                        <Ionicons name="close" size={28} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Hiển thị Caption của Story */}
            {(() => {
                if (!currentStory?.caption) return null;
                try {
                    const parsed = JSON.parse(currentStory.caption);
                    if (parsed && typeof parsed === 'object' && parsed.text) {
                        const topPos = parsed.py ? parsed.py * height : height * 0.4;
                        const leftPos = parsed.px ? parsed.px * width : width * 0.1;
                        return (
                            <View 
                                style={{
                                    position: 'absolute',
                                    top: topPos,
                                    left: leftPos,
                                    zIndex: 30,
                                }}
                            >
                                <Text className="text-white text-base font-bold bg-black/65 px-4 py-2 rounded-2xl border border-white/10 text-center">
                                    {parsed.text}
                                </Text>
                            </View>
                        );
                    }
                } catch (e) {
                    // Không phải JSON
                }
                return (
                    <View className="absolute bottom-28 left-0 right-0 px-6 items-center z-10">
                        <Text className="text-white text-sm text-center bg-black/55 px-4 py-2 rounded-2xl">
                            {currentStory.caption}
                        </Text>
                    </View>
                );
            })()}

            {/* Khay Emoji cảm xúc cho người xem khác */}
            {!isCurrentUser && isAuthenticated && (
                <View className="absolute bottom-8 left-0 right-0 items-center z-10 px-4">
                    <View className="flex-row items-center justify-around bg-black/45 px-4 py-2 rounded-full w-full max-w-sm" style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                        {['❤️', '😂', '😮', '😢', '😡', '👍'].map((emoji) => (
                            <TouchableOpacity 
                                key={emoji} 
                                onPress={() => handleReactStory(emoji)}
                                className="p-1 transform active:scale-125"
                            >
                                <Text style={{ fontSize: 24 }}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Nút xem người xem dành cho chính chủ */}
            {isCurrentUser && (
                <TouchableOpacity 
                    onPress={() => {
                        setIsPaused(true);
                        setShowViewers(true);
                    }}
                    className="absolute bottom-8 left-4 flex-row items-center bg-black/55 px-4 py-2.5 rounded-full z-10"
                    activeOpacity={0.8}
                    style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                >
                    <Ionicons name="eye-outline" size={18} color="white" />
                    <Text className="text-white text-xs font-semibold ml-1.5">
                        {currentStory.viewers?.length || 0} người xem
                    </Text>
                </TouchableOpacity>
            )}

            {/* Hai vùng bấm chuyển tiếp/lùi lại vô hình */}
            <View style={styles.touchAreaContainer}>
                <TouchableOpacity style={styles.leftTouch} activeOpacity={1} onPress={goToPrevStory} />
                <TouchableOpacity style={styles.rightTouch} activeOpacity={1} onPress={goToNextStory} />
            </View>

            {/* Modal danh sách người xem */}
            <Modal
                visible={showViewers}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setShowViewers(false);
                    setIsPaused(false);
                }}
            >
                <View style={styles.modalContainer}>
                    <Pressable style={styles.modalOverlay} onPress={() => { setShowViewers(false); setIsPaused(false); }} />
                    <View style={[styles.modalContent, { backgroundColor: '#1A1625' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                                Người đã xem ({currentStory.viewers?.length || 0})
                            </Text>
                            <TouchableOpacity onPress={() => { setShowViewers(false); setIsPaused(false); }} className="p-1">
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        
                        {loadingViewers ? (
                            <View className="py-12 items-center">
                                <ActivityIndicator size="small" color="#038eff" />
                            </View>
                        ) : viewersList.length === 0 ? (
                            <View className="py-12 items-center">
                                <Text style={{ color: '#94A3B8', fontSize: 13 }}>Chưa có người xem nào</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={viewersList}
                                keyExtractor={(item, index) => `${item.userId}-${index}`}
                                renderItem={({ item }) => {
                                    const vAvatar = item.profilePicture 
                                        ? getMediaUrl(item.profilePicture) 
                                        : `https://ui-avatars.com/api/?name=${item.username}&background=random`;
                                    return (
                                        <View className="flex-row items-center justify-between py-3.5 border-b border-slate-800">
                                            <View className="flex-row items-center gap-3">
                                                <Image source={{ uri: vAvatar }} style={{ width: 38, height: 38, borderRadius: 19 }} />
                                                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                                                    {item.username}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                }}
                                style={{ maxHeight: 350 }}
                                contentContainerStyle={{ paddingBottom: 20 }}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    touchAreaContainer: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
        zIndex: 5,
    },
    leftTouch: {
        flex: 0.3, // 30% màn hình bên trái
    },
    rightTouch: {
        flex: 0.7, // 70% màn hình bên phải
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        maxHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        marginBottom: 10,
    },
});
