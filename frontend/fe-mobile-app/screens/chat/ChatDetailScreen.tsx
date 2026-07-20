import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import {
    View, FlatList, Text, KeyboardAvoidingView, Platform,
    StyleSheet, ActivityIndicator, Alert, TouchableOpacity,
    Modal, Pressable
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { getMessagesThunk, getConversationsThunk } from '@/features/chat/thunk/chat.thunk';
import {
    setCurrentConversation, addOptimisticMessage, removeOptimisticMessage,
    setTypingUser, deleteMessageLocal, toggleReactionLocal
} from '@/features/chat/slice/chat.slice';
import { followUserThunk, getFollowingThunk } from '@/features/interaction/thunk/interaction.thunk';
import socketService from '@/utils/helpers/socket_helper';
import ChatDetailHeader from './components/ChatDetailHeader';
import MessageBubble from './components/MessageBubble';
import ChatInput from './components/ChatInput';
import dayjs from 'dayjs';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import { ChatMessage } from '@/features/chat/type/chat.types';
import { chatService } from '@/features/chat/service/chat.service';
import { accountService } from '@/features/account/service/account.service';
import { useColorScheme } from 'nativewind';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const getMimeType = (uri: string) => {
    const extension = uri.split('.').pop()?.toLowerCase();
    if (extension === 'mp4') return 'video/mp4';
    if (extension === 'mov') return 'video/quicktime';
    if (extension === 'm4v') return 'video/x-m4v';
    if (extension === 'png') return 'image/png';
    if (extension === 'gif') return 'image/gif';
    if (extension === 'webp') return 'image/webp';
    return 'image/jpeg'; // fallback
};

const getFileName = (uri: string) => {
    const part = uri.split('/').pop() || `file_${Date.now()}`;
    return part;
};

export default function ChatDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const { user, token } = useAppSelector(state => state.auth);
    const {
        messagesList = [],
        isLoading,
        conversations = [],
        onlineUsers = [],
        typingUsers = {},
    } = useAppSelector(state => state.chat);
    const { following = [] } = useAppSelector(state => state.interaction);
    const { colorScheme } = useColorScheme();

    const [reactionModalVisible, setReactionModalVisible] = useState(false);
    const [selectedMessageForReaction, setSelectedMessageForReaction] = useState<ChatMessage | null>(null);

    const flatListRef = useRef<FlatList>(null);
    const [localConversation, setLocalConversation] = useState<any>(null);
    const [receiverProfile, setReceiverProfile] = useState<{
        username: string;
        profilePicture?: string;
    } | null>(null);

    const currentConversation = conversations?.find(c => c._id === id) || localConversation;
    const receiverId = currentConversation?.participants?.find((p: string) => p !== user?.userId);
    const isReceiverTyping = receiverId ? (typingUsers[receiverId] ?? false) : false;

    const displayName = receiverProfile?.username || currentConversation?.name || 'Đang tải...';
    const displayAvatar = receiverProfile?.profilePicture || currentConversation?.avatar;
    const receiverAvatarUri = getMediaUrl(displayAvatar) ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=7c3bed&color=fff`;

    // Kiểm tra trạng thái follow
    const isFollowing = useMemo(() => {
        if (!receiverId) return true; // Mặc định là true nếu là group hoặc không xác định được
        return following.some(f => String(f.userId) === String(receiverId));
    }, [following, receiverId]);

    // Đảo ngược danh sách tin nhắn để hiển thị bottom-up qua inverted FlatList
    const reversedMessages = useMemo(() => {
        return [...messagesList].reverse();
    }, [messagesList]);

    const isDark = colorScheme === 'dark';

    useEffect(() => {
        if (user?.userId) {
            if (conversations.length === 0) {
                dispatch(getConversationsThunk(user.userId));
            }
            dispatch(getFollowingThunk(user.userId));
        }
    }, [dispatch, user?.userId]);

    // Tự động kết nối lại socket nếu bị ngắt kết nối khi vào màn hình chat
    useEffect(() => {
        if (user?.userId && token && !socketService.isConnected()) {
            console.log('🔌 Chat screen detected socket disconnected, forcing reconnect...');
            socketService.connect(user.userId, token);
        }
    }, [user?.userId, token]);

    useEffect(() => {
        if (id && !conversations?.find(c => c._id === id)) {
            chatService.getConversationById(id)
                .then(conv => { if (conv) setLocalConversation(conv); })
                .catch(() => { if (user?.userId) dispatch(getConversationsThunk(user.userId)); });
        }
    }, [id, conversations]);

    useEffect(() => {
        if (!receiverId || receiverProfile) return;
        accountService.getProfile(receiverId)
            .then(res => {
                if (res?.data) {
                    setReceiverProfile({
                        username: res.data.username || 'Người dùng',
                        profilePicture: res.data.profilePicture ?? undefined,
                    });
                }
            })
            .catch(() => { });
    }, [receiverId]);

    useEffect(() => {
        if (id) {
            dispatch(setCurrentConversation(id));
            dispatch(getMessagesThunk(id));
        }
        return () => { dispatch(setCurrentConversation(null)); };
    }, [id, dispatch]);

    useEffect(() => {
        const unsubscribe = socketService.onUserTyping((data) => {
            dispatch(setTypingUser({ userId: data.userId, isTyping: data.isTyping }));
            if (data.isTyping) {
                setTimeout(() => {
                    dispatch(setTypingUser({ userId: data.userId, isTyping: false }));
                }, 3000);
            }
        });
        return () => { if (unsubscribe) unsubscribe(); };
    }, [dispatch]);

    // Tự động ghim xuống đáy đã được xử lý bằng FlatList inverted=true

    // Theo dõi nhanh đối phương
    const handleFollowReceiver = async () => {
        if (!user?.userId || !receiverId) return;
        try {
            await dispatch(followUserThunk({
                followerId: user.userId,
                followingId: receiverId
            })).unwrap();
            dispatch(getFollowingThunk(user.userId));
        } catch (error) {
            Alert.alert('Thất bại', 'Không thể theo dõi người dùng này lúc này.');
        }
    };

    // Thực hiện gọi API và cập nhật giao diện khi xoá tin nhắn
    const performDeleteMessage = async (messageId: string, deleteType: 'deleteForMe' | 'deleteForEveryone') => {
        if (!user?.userId) return;
        try {
            await chatService.deleteMessage(messageId, user.userId, deleteType);
            dispatch(deleteMessageLocal({ messageId, deleteType, userId: user.userId }));
        } catch (error) {
            Alert.alert('Thất bại', 'Không thể xóa tin nhắn này. Vui lòng thử lại sau.');
        }
    };

    // Xử lý sự kiện ấn giữ tin nhắn
    const handleMessageLongPress = (message: ChatMessage) => {
        if (message.isDeleted || message.isOptimistic) return;
        const isOutgoing = message.senderId === user?.userId;

        if (isOutgoing) {
            Alert.alert(
                'Lựa chọn tin nhắn',
                'Bạn muốn xử lý tin nhắn này thế nào?',
                [
                    { text: 'Hủy', style: 'cancel' },
                    {
                        text: 'Thu hồi',
                        style: 'destructive',
                        onPress: () => performDeleteMessage(message._id, 'deleteForEveryone')
                    },
                    {
                        text: 'Xóa phía tôi',
                        onPress: () => performDeleteMessage(message._id, 'deleteForMe')
                    }
                ],
                { cancelable: true }
            );
        } else {
            setSelectedMessageForReaction(message);
            setReactionModalVisible(true);
        }
    };

    // Gửi biểu cảm emoji cho tin nhắn
    const handleSelectReaction = async (emoji: string) => {
        if (!selectedMessageForReaction || !user?.userId) return;
        const messageId = selectedMessageForReaction._id;
        
        setReactionModalVisible(false);

        try {
            // Cập nhật Redux local để UI phản ứng ngay lập tức
            dispatch(toggleReactionLocal({ messageId, userId: user.userId, emoji }));
            // Gọi API Backend lưu vào DB và phát socket
            await chatService.toggleReaction(messageId, user.userId, emoji);
        } catch (error) {
            console.error('Failed to toggle reaction:', error);
        } finally {
            setSelectedMessageForReaction(null);
        }
    };

    // ── Gửi tin nhắn (Văn bản + Ảnh) ──
    const handleSendMessage = useCallback(async (text: string, imageUris?: string[]) => {
        if (!user || !id || !receiverId) return;
        if (!text.trim() && (!imageUris || imageUris.length === 0)) return;

        const tempId = `temp_${Date.now()}`;

        // 1. Tạo tin nhắn tạm thời (Optimistic Update)
        const optimisticFiles = imageUris && imageUris.length > 0
            ? imageUris.map((uri, idx) => ({ url: uri, filename: `uploading_${idx}`, mimetype: 'image/jpeg' }))
            : [];

        const optimisticMessage: ChatMessage = {
            _id: tempId,
            senderId: user.userId,
            receiverId,
            conversationId: id,
            content: text.trim(),
            files: optimisticFiles,
            status: 'sent',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isOptimistic: true,
        };

        dispatch(addOptimisticMessage(optimisticMessage));

        try {
            // 2. Upload files first, store only backend paths
            let uploadedFiles: any[] = [];
            if (imageUris && imageUris.length > 0) {
                const formData = new FormData();
                imageUris.forEach((imageUri) => {
                    const mimeType = getMimeType(imageUri);
                    const fileName = getFileName(imageUri);
                    const fileToUpload = {
                        uri: imageUri,
                        name: fileName,
                        type: mimeType,
                    };
                    formData.append('files', fileToUpload as any);
                });

                const uploadRes = await chatService.uploadFile(formData);
                if (uploadRes?.data && Array.isArray(uploadRes.data)) {
                    uploadedFiles = uploadRes.data.map((f: any) => ({
                        url: f.url,              // Full backend URL: http://host:port/chat/xyz.jpg
                        filename: f.filename,    // e.g., "chat/xyz.jpg"
                        mimetype: f.mimetype,
                        size: f.size
                    }));
                }
            }

            // 3. Send via Socket with final paths
            const sent = socketService.sendMessage({
                senderId: user.userId,
                receiverId,
                conversationId: id,
                content: text.trim(),
                files: uploadedFiles,
                messageType: uploadedFiles.length > 0 ? (text.trim() ? 'mixed' : 'file') : 'text'
            });

            if (!sent) {
                dispatch(removeOptimisticMessage(tempId));
            }

        } catch (error) {
            console.error('Failed to send message:', error);
            dispatch(removeOptimisticMessage(tempId));
        }
    }, [user, id, receiverId, dispatch]);

    const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
        const isOutgoing = item.senderId === user?.userId;
        
        // Với FlatList đảo ngược (inverted), tin nhắn cũ hơn nằm ở index lớn hơn
        const prevMsg = index < reversedMessages.length - 1 ? reversedMessages[index + 1] : null;
        // Tin nhắn mới hơn nằm ở index nhỏ hơn
        const nextMsg = index > 0 ? reversedMessages[index - 1] : null;

        const isStacked = !!prevMsg && prevMsg.senderId === item.senderId;
        const hideTime = !!nextMsg && nextMsg.senderId === item.senderId;

        return (
            <MessageBubble
                key={item._id}
                type={isOutgoing ? 'outgoing' : 'incoming'}
                text={item.isDeleted ? '[Tin nhắn đã bị xóa]' : item.content}
                time={dayjs(item.createdAt).format('HH:mm')}
                seen={item.status === 'read'}
                avatar={!isOutgoing ? receiverAvatarUri : undefined}
                files={item.files}
                isStacked={isStacked}
                hideTime={hideTime}
                isOptimistic={item.isOptimistic}
                onLongPress={() => handleMessageLongPress(item)}
                reactions={item.reactions}
            />
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0F0A1F' : '#f7f6f8' }]}>
            <ChatDetailHeader
                name={displayName}
                avatar={displayAvatar}
                online={onlineUsers?.includes(receiverId || '')}
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >

            {/* Banner theo dõi nếu chưa follow đối phương */}
            {!currentConversation?.isGroup && receiverId && !isFollowing && (
                <View 
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        backgroundColor: isDark ? 'rgba(124, 61, 237, 0.2)' : 'rgba(124, 61, 237, 0.1)',
                        borderBottomWidth: 1,
                        borderBottomColor: 'rgba(124, 61, 237, 0.2)'
                    }}
                >
                    <Text 
                        style={{
                            fontSize: 12,
                            color: isDark ? '#e2e8f0' : '#475569',
                            fontWeight: '500'
                        }}
                    >
                        Bạn chưa theo dõi người dùng này
                    </Text>
                    <TouchableOpacity
                        onPress={handleFollowReceiver}
                        activeOpacity={0.8}
                    >
                        <View 
                            style={{
                                backgroundColor: isDark ? '#a855f7' : '#7c3bed',
                                paddingHorizontal: 14,
                                paddingVertical: 6,
                                borderRadius: 9999,
                                shadowColor: '#7c3bed',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.2,
                                shadowRadius: 2,
                                elevation: 2
                            }}
                        >
                            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>Theo dõi</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            )}

            {isLoading && messagesList.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#7c3bed" />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    style={styles.messageList}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}
                    data={reversedMessages}
                    keyExtractor={(item) => item._id}
                    renderItem={renderMessage}
                    showsVerticalScrollIndicator={false}
                    inverted={true}
                    ListHeaderComponent={
                        isReceiverTyping ? (
                            <MessageBubble
                                type="typing"
                                avatar={receiverAvatarUri}
                            />
                        ) : null
                    }
                    ListEmptyComponent={
                        !isLoading ? (
                            <View className="flex-1 items-center justify-center py-20" style={{ transform: [{ scaleY: -1 }] }}>
                                <Text className="text-slate-500 dark:text-slate-400">Chưa có tin nhắn. Hãy gửi lời chào! 👋</Text>
                            </View>
                        ) : null
                    }
                />
            )}

            <ChatInput
                onSend={handleSendMessage}
                senderId={user?.userId}
                receiverId={receiverId}
            />

            {/* Modal chọn Emoji reaction */}
            <Modal
                visible={reactionModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setReactionModalVisible(false)}
            >
                <Pressable 
                    style={styles.modalOverlay} 
                    onPress={() => setReactionModalVisible(false)}
                >
                    <View style={[styles.reactionContainer, { backgroundColor: isDark ? '#1E1445' : '#FFFFFF' }]}>
                        <Text style={[styles.reactionTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>Biểu cảm tin nhắn</Text>
                        
                        <View style={styles.emojiList}>
                            {EMOJIS.map((emoji) => (
                                <TouchableOpacity 
                                    key={emoji} 
                                    onPress={() => handleSelectReaction(emoji)}
                                    style={styles.emojiItem}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.emojiText}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]} />

                        <TouchableOpacity 
                            style={styles.menuItem}
                            onPress={() => {
                                setReactionModalVisible(false);
                                if (selectedMessageForReaction) {
                                    performDeleteMessage(selectedMessageForReaction._id, 'deleteForMe');
                                }
                            }}
                        >
                            <Text style={styles.deleteText}>Xóa tin nhắn phía tôi</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.menuItem, { marginTop: 4 }]}
                            onPress={() => setReactionModalVisible(false)}
                        >
                            <Text style={[styles.cancelText, { color: isDark ? '#94A3B8' : '#64748B' }]}>Hủy</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </KeyboardAvoidingView>
    </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    messageList: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reactionContainer: {
        width: '80%',
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    reactionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 16,
    },
    emojiList: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 8,
    },
    emojiItem: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emojiText: {
        fontSize: 28,
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: 16,
    },
    menuItem: {
        width: '100%',
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteText: {
        color: '#EF4444',
        fontSize: 15,
        fontWeight: '600',
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '500',
    },
});

