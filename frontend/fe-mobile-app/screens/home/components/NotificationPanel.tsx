import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { getNotificationsThunk, markAsReadThunk, markAllAsReadThunk } from '@/features/notification/thunk/notification.thunk';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { useColorScheme } from 'nativewind';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { width, height } = Dimensions.get('window');

interface NotificationPanelProps {
    isVisible: boolean;
    onClose: () => void;
}

export default function NotificationPanel({ isVisible, onClose }: NotificationPanelProps) {
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(width)).current;
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.auth.user);
    const { notifications, isLoading, unreadCount } = useAppSelector(state => state.notification);

    useEffect(() => {
        if (isVisible) {
            // Lấy thông báo khi mở panel
            if (user?.userId) {
                dispatch(getNotificationsThunk(user.userId));
            }
            
            // Animation trượt vào
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            // Animation trượt ra
            Animated.timing(slideAnim, {
                toValue: width,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [isVisible, user?.userId]);

    const handleMarkAsRead = (id: string) => {
        if (user?.userId) {
            dispatch(markAsReadThunk({ id, userId: user.userId }));
        }
    };

    const handleMarkAllAsRead = () => {
        if (user?.userId) {
            dispatch(markAllAsReadThunk(user.userId));
        }
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'LIKE': return <MaterialIcons name="favorite" size={20} color="#ec4899" />;
            case 'COMMENT': return <MaterialIcons name="chat-bubble" size={20} color="#06B6D4" />;
            case 'FOLLOW': return <MaterialIcons name="person-add" size={20} color="#7c3bed" />;
            default: return <MaterialIcons name="notifications" size={20} color="white" />;
        }
    };

    return (
        <Animated.View 
            style={[
                styles.container, 
                { transform: [{ translateX: slideAnim }] },
                { paddingTop: Math.max(20, insets.top), backgroundColor: isDark ? '#0F0A1F' : '#f7f6f8' }
            ]}
        >
            <View className="flex-row items-center justify-between px-4 pb-4 border-b border-black/10 dark:border-white/10">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={onClose} className="p-2 -ml-2 rounded-full active:bg-black/5 dark:active:bg-white/10">
                        <MaterialIcons name="arrow-back" size={24} color={isDark ? 'white' : '#1E293B'} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-slate-800 dark:text-white">Thông báo</Text>
                    {unreadCount > 0 && (
                        <View className="bg-red-500 rounded-full px-2 py-0.5">
                            <Text className="text-white text-xs font-bold">{unreadCount}</Text>
                        </View>
                    )}
                </View>
                
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={handleMarkAllAsRead}>
                        <MaterialIcons name="done-all" size={24} color="#06B6D4" />
                    </TouchableOpacity>
                )}
            </View>

            {isLoading && notifications.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#7c3bed" />
                </View>
            ) : (
                <ScrollView 
                    className="flex-1 px-4 pt-2"
                    showsVerticalScrollIndicator={false}
                >
                    {notifications.length > 0 ? (
                        notifications.map((item) => (
                            <TouchableOpacity 
                                key={item._id}
                                onPress={() => handleMarkAsRead(item._id)}
                                activeOpacity={0.8}
                                className={`flex-row items-center gap-4 py-4 border-b border-black/5 dark:border-white/5 ${!item.isRead ? (isDark ? 'bg-white/5' : 'bg-slate-100') + ' rounded-xl px-2 mb-1 border-b-0' : ''}`}
                            >
                                <View className="bg-slate-200 dark:bg-white/10 p-3 rounded-full">
                                    {getIconForType(item.type)}
                                </View>
                                
                                <View className="flex-1">
                                    <Text className="text-sm text-slate-800 dark:text-white" numberOfLines={2}>
                                        {item.content}
                                    </Text>
                                    <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                                        {dayjs(item.createdAt).fromNow()}
                                    </Text>
                                </View>

                                {!item.isRead && (
                                    <View className="w-2.5 h-2.5 bg-[#06B6D4] rounded-full" />
                                )}
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View className="flex-1 items-center justify-center py-20 mt-20">
                            <MaterialIcons name="notifications-none" size={64} color={isDark ? 'gray' : '#CBD5E1'} />
                            <Text className="text-slate-500 dark:text-slate-400 mt-4 text-center">Bạn không có thông báo nào.</Text>
                        </View>
                    )}
                    <View className="h-10" />
                </ScrollView>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: width,
        height: height,
        zIndex: 100,
        elevation: 10,
    }
});
