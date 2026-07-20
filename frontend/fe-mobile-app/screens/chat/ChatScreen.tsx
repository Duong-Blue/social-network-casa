import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { getConversationsThunk } from '@/features/chat/thunk/chat.thunk';
import { getFollowingThunk } from '@/features/interaction/thunk/interaction.thunk';
import { deleteConversationLocal } from '@/features/chat/slice/chat.slice';
import { chatService } from '@/features/chat/service/chat.service';
import ChatHeader from './components/ChatHeader';
import ChatItem from './components/ChatItem';
import ActiveUserItem from './components/ActiveUserItem';
import dayjs from 'dayjs';
import { useColorScheme } from 'nativewind';
import GlobalRefreshControl from '@/components/GlobalRefreshControl';

export default function ChatScreen() {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.auth.user);
    const { conversations = [], isLoading, onlineUsers = [] } = useAppSelector(state => state.chat);
    const { following = [] } = useAppSelector(state => state.interaction);
    const { colorScheme } = useColorScheme();
    const [activeTab, setActiveTab] = useState<'main' | 'stranger'>('main');
    const [refreshing, setRefreshing] = useState(false);

    const getLastMessageText = (lastMessage?: any, isGroup?: boolean, receiverName?: string) => {
        if (!lastMessage) return 'Chưa có tin nhắn';
        
        let messageBody = '';
        
        if (lastMessage.files && lastMessage.files.length > 0) {
            const imageCount = lastMessage.files.filter((f: any) => f.mimetype?.startsWith('image/')).length;
            const videoCount = lastMessage.files.filter((f: any) => f.mimetype?.startsWith('video/')).length;
            
            if (imageCount > 0 && videoCount > 0) {
                messageBody = `Đã gửi ${imageCount} ảnh và ${videoCount} video`;
            } else if (imageCount > 0) {
                messageBody = imageCount === 1 ? 'Đã gửi một ảnh' : `Đã gửi ${imageCount} ảnh`;
            } else if (videoCount > 0) {
                messageBody = videoCount === 1 ? 'Đã gửi một video' : `Đã gửi ${videoCount} video`;
            } else {
                messageBody = 'Đã gửi tệp đính kèm';
            }
        } else if (lastMessage.isDeleted) {
            messageBody = 'Tin nhắn đã bị thu hồi';
        } else {
            messageBody = lastMessage.content || '';
        }

        if (!messageBody) return 'Chưa có tin nhắn';

        const isMyMessage = lastMessage.senderId === user?.userId;
        if (isMyMessage) {
            return `Bạn: ${messageBody}`;
        } else {
            return messageBody;
        }
    };

    const onRefresh = useCallback(async () => {
        if (!user?.userId) return;
        setRefreshing(true);
        try {
            await Promise.all([
                dispatch(getConversationsThunk(user.userId)).unwrap(),
                dispatch(getFollowingThunk(user.userId)).unwrap()
            ]);
        } catch (err) {
            console.error('Failed to refresh chats:', err);
        } finally {
            setRefreshing(false);
        }
    }, [dispatch, user?.userId]);

    useEffect(() => {
        if (user?.userId) {
            dispatch(getConversationsThunk(user.userId));
            dispatch(getFollowingThunk(user.userId));
        }
    }, [dispatch, user?.userId]);

    const isDark = colorScheme === 'dark';

    const tabItemStyle = (tab: 'main' | 'stranger') => {
        const isActive = activeTab === tab;
        return {
            paddingVertical: 10,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            borderRadius: 8,
            flexDirection: 'row' as const,
            gap: 6,
            backgroundColor: isActive 
                ? (isDark ? '#334155' : '#FFFFFF') 
                : 'transparent',
            ...(isActive ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.15,
                shadowRadius: 2,
                elevation: 2,
            } : {})
        };
    };

    const tabTextStyle = (tab: 'main' | 'stranger') => {
        const isActive = activeTab === tab;
        return {
            fontWeight: 'bold' as const,
            fontSize: 14,
            color: isActive 
                ? (isDark ? '#a855f7' : '#7c3bed') 
                : (isDark ? '#94a3b8' : '#64748b')
        };
    };

    // Phân loại hội thoại và tính toán số tin nhắn chưa đọc của từng tab
    const { mainConversations, strangerConversations, mainUnreadCount, strangerUnreadCount } = useMemo(() => {
        const mainList: typeof conversations = [];
        const strangerList: typeof conversations = [];
        let mainUnread = 0;
        let strangerUnread = 0;

        conversations.forEach(c => {
            const otherUserId = c.participants?.find(p => p !== user?.userId);
            const isFollowing = otherUserId ? following.some(f => String(f.userId) === String(otherUserId)) : false;

            if (c.isGroup || isFollowing) {
                mainList.push(c);
                mainUnread += c.unreadCount || 0;
            } else {
                strangerList.push(c);
                strangerUnread += c.unreadCount || 0;
            }
        });

        return {
            mainConversations: mainList,
            strangerConversations: strangerList,
            mainUnreadCount: mainUnread,
            strangerUnreadCount: strangerUnread,
        };
    }, [conversations, following, user?.userId]);

    // Lọc danh sách bạn bè online dựa trên các cuộc hội thoại hiển thị ở tab hiện tại
    const activeUsers = useMemo(() => {
        if (!user?.userId) return [];
        const currentList = activeTab === 'main' ? mainConversations : strangerConversations;
        return currentList
            .map(c => {
                const otherParticipant = c.participants?.find(p => p !== user.userId);
                return {
                    userId: otherParticipant,
                    conversationId: c._id
                };
            })
            .filter(u => !!u.userId && onlineUsers.includes(u.userId));
    }, [activeTab, mainConversations, strangerConversations, onlineUsers, user?.userId]);

    const handleDeleteConversation = (conversationId: string) => {
        Alert.alert(
            'Xóa cuộc hội thoại',
            'Bạn có chắc chắn muốn xóa cuộc hội thoại này không? Toàn bộ lịch sử tin nhắn sẽ bị xóa phía bạn.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await chatService.deleteConversation(conversationId);
                            dispatch(deleteConversationLocal(conversationId));
                        } catch (err) {
                            Alert.alert('Lỗi', 'Không thể xóa cuộc hội thoại này, vui lòng thử lại sau.');
                        }
                    }
                }
            ]
        );
    };

    const currentDisplayConversations = activeTab === 'main' ? mainConversations : strangerConversations;

    const renderHeader = () => (
        <View className="px-1 mb-4">
            {activeUsers.length > 0 && (
                <View className="mb-6">
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">Đang hoạt động</Text>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={activeUsers}
                        renderItem={({ item }) => (
                            <ActiveUserItem 
                                userId={item.userId!} 
                                conversationId={item.conversationId} 
                            />
                        )}
                        keyExtractor={(item) => item.userId!}
                    />
                </View>
            )}
            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">Trò chuyện gần đây</Text>
        </View>
    );

    return (
        <View className="flex-1 bg-[#f7f6f8] dark:bg-[#0F0A1F]">
            <ChatHeader />

            {/* Segmented Tab Selector */}
            <View 
                style={{
                    flexDirection: 'row',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(148, 163, 184, 0.15)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(203, 213, 225, 0.2)',
                    marginBottom: 16,
                    marginHorizontal: 16,
                    borderRadius: 12,
                    padding: 4
                }}
            >
                <TouchableOpacity 
                    onPress={() => setActiveTab('main')}
                    style={{ flex: 1 }}
                    activeOpacity={0.8}
                >
                    <View style={tabItemStyle('main')}>
                        <Text style={tabTextStyle('main')}>
                            Trò chuyện
                        </Text>
                        {mainUnreadCount > 0 && (
                            <View className="bg-[#F43F5E] rounded-full h-5 min-w-[20px] px-1.5 items-center justify-center">
                                <Text className="text-[10px] font-bold text-white">{mainUnreadCount}</Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setActiveTab('stranger')}
                    style={{ flex: 1 }}
                    activeOpacity={0.8}
                >
                    <View style={tabItemStyle('stranger')}>
                        <Text style={tabTextStyle('stranger')}>
                            Người lạ
                        </Text>
                        {strangerUnreadCount > 0 && (
                            <View className="bg-[#F43F5E] rounded-full h-5 min-w-[20px] px-1.5 items-center justify-center">
                                <Text className="text-[10px] font-bold text-white">{strangerUnreadCount}</Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            {isLoading && conversations.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#7c3bed" />
                </View>
            ) : (
                <FlatList
                    className="flex-1 px-4 pt-2"
                    data={currentDisplayConversations}
                    keyExtractor={(item) => item._id}
                    ListHeaderComponent={renderHeader}
                    refreshControl={
                        <GlobalRefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    }
                    renderItem={({ item }) => {
                        const otherUserId = item.participants?.find(p => p !== user?.userId);
                        return (
                            <ChatItem
                                item={{
                                    id: item._id,
                                    name: item.name || 'Trò chuyện riêng',
                                    avatar: item.avatar,
                                    receiverId: otherUserId,
                                    message: getLastMessageText(item.lastMessage, item.isGroup, item.name),
                                    time: item.lastMessage ? dayjs(item.lastMessage.createdAt).format('HH:mm') : '',
                                    unreadCount: item.unreadCount,
                                    online: !!otherUserId && onlineUsers.includes(otherUserId),
                                    isGroup: item.isGroup
                                }}
                                onLongPress={handleDeleteConversation}
                            />
                        );
                    }}
                    ListEmptyComponent={
                        !isLoading ? (
                            <View className="py-20 items-center">
                                <Text className="text-slate-500 dark:text-slate-400">
                                    {activeTab === 'main' ? 'Không tìm thấy cuộc trò chuyện nào.' : 'Không có cuộc trò chuyện nào từ người lạ.'}
                                </Text>
                            </View>
                        ) : null
                    }
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

