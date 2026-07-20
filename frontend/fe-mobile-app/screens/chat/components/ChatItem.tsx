import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import { accountService } from '@/features/account/service/account.service';
import { useColorScheme } from 'nativewind';

export interface ChatItemProps {
    id: string;
    name: string;
    avatar?: string;
    receiverId?: string;
    isGroup?: boolean;
    groupInitial?: string;
    message: React.ReactNode;
    time: string;
    unreadCount?: number;
    online?: boolean;
    isOffline?: boolean;
}

export default function ChatItem({ item, onLongPress }: { item: ChatItemProps; onLongPress?: (id: string) => void }) {
    const router = useRouter();
    const [profile, setProfile] = useState<{ username: string; profilePicture?: string } | null>(null);
    const isMounted = useRef(true);
    const { colorScheme } = useColorScheme();

    useEffect(() => {
        isMounted.current = true;
        if (item.receiverId && !item.isGroup) {
            accountService.getProfile(item.receiverId)
                .then(res => {
                    if (isMounted.current && res?.data) {
                        setProfile({
                            username: res.data.username || 'Người dùng',
                            profilePicture: res.data.profilePicture || undefined,
                        });
                    }
                })
                .catch(() => {});
        }
        return () => {
            isMounted.current = false;
        };
    }, [item.receiverId]);

    const displayName = profile?.username || item.name || 'Người dùng';
    const displayAvatar = profile?.profilePicture || item.avatar;
    const avatarUri = getMediaUrl(displayAvatar) ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=7c3bed&color=fff`;

    const handlePress = () => {
        router.push(('/chat/' + item.id) as any);
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            onLongPress={() => onLongPress && onLongPress(item.id)}
            activeOpacity={0.7}
            className="flex-row items-center gap-4 p-3 rounded-2xl bg-white dark:bg-white/[0.03] mb-2 border border-slate-200 dark:border-transparent active:bg-slate-50 dark:active:bg-white/5"
        >
            <View className="relative shrink-0">
                {item.isGroup ? (
                    <LinearGradient
                        colors={['#6366f1', '#a855f7', '#ec4899']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="h-[52px] w-[52px] rounded-full items-center justify-center"
                    >
                        <Text className="text-white font-bold text-lg">{item.groupInitial || 'G'}</Text>
                    </LinearGradient>
                ) : (
                    <View className={`h-[52px] w-[52px] rounded-full bg-slate-200 dark:bg-slate-800 ${item.isOffline ? 'opacity-70' : ''}`}>
                        <Image
                            source={{ uri: avatarUri }}
                            className={`w-full h-full rounded-full ${item.online ? 'border-2 border-[#7c3bed]/30' : ''}`}
                            resizeMode="cover"
                        />
                    </View>
                )}

                {item.online && (
                    <View className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-[#06B6D4] rounded-full border-[2px] border-white dark:border-[#0F0A1F]" />
                )}
            </View>

            <View className="flex-1">
                <View className="flex-row justify-between items-baseline mb-[2px]">
                    <Text
                        className={`font-semibold text-base ${item.isOffline ? 'text-slate-400 dark:text-slate-300' : 'text-slate-800 dark:text-white'}`}
                        numberOfLines={1}
                        style={{ flex: 1, marginRight: 8 }}
                    >
                        {displayName}
                    </Text>
                    <Text className={`text-xs shrink-0 ${item.unreadCount ? 'text-[#7c3bed] font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                        {item.time}
                    </Text>
                </View>

                <View className="flex-row justify-between items-center pr-2">
                    <Text
                        className="text-sm text-slate-500 dark:text-slate-400 font-medium"
                        numberOfLines={1}
                        style={{ flex: 1, marginRight: item.unreadCount ? 8 : 0 }}
                    >
                        {item.message}
                    </Text>

                    {item.unreadCount ? (
                        <View className="h-5 min-w-[20px] px-1.5 items-center justify-center bg-[#F43F5E] rounded-full">
                            <Text className="text-[10px] font-bold text-white">{item.unreadCount}</Text>
                        </View>
                    ) : null}
                </View>
            </View>
        </TouchableOpacity>
    );
}
