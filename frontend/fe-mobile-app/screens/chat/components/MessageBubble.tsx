import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import { useColorScheme } from 'nativewind';
import MultiImageGrid from '@/screens/home/components/MultiImageGrid';

interface MessageBubbleProps {
    type: 'incoming' | 'outgoing' | 'typing';
    text?: string;
    time?: string;
    avatar?: string;
    isStacked?: boolean;
    hideTime?: boolean;
    seen?: boolean;
    files?: any[]; // Thêm prop files
    isOptimistic?: boolean; 
    onLongPress?: () => void; // Thêm prop này
    reactions?: { [emoji: string]: string[] }; // Nhận thêm prop reactions
}

export default function MessageBubble({ type, text, time, avatar, isStacked, hideTime, seen, files, isOptimistic, onLongPress, reactions }: MessageBubbleProps) {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    if (type === 'typing') {
        return (
            <View className="flex-row items-end gap-3 mt-2">
                <View className="h-8 w-8 shrink-0 mb-1">
                    {avatar && <Image source={{ uri: avatar }} className="w-full h-full rounded-full" />}
                </View>
                <View className="px-4 py-3 rounded-3xl rounded-bl-none bg-slate-200/60 dark:bg-white/5 border border-slate-300 dark:border-white/10 flex-row items-center gap-1 h-10 w-16 justify-center">
                    <View className="w-1.5 h-1.5 bg-[#06B6D4] rounded-full opacity-60" />
                    <View className="w-1.5 h-1.5 bg-[#06B6D4] rounded-full opacity-80" />
                    <View className="w-1.5 h-1.5 bg-[#06B6D4] rounded-full opacity-100" />
                </View>
            </View>
        );
    }

    const isIncoming = type === 'incoming';

    return (
        <View className={`flex-row items-end gap-3 ${isIncoming ? '' : 'justify-end'} ${isStacked ? 'mt-1' : 'mt-4'} ${isOptimistic ? 'opacity-60' : ''}`}>
            {/* Avatar cho Incoming */}
            {isIncoming && (
                <View className={`h-8 w-8 shrink-0 ${isStacked ? 'opacity-0 h-0' : 'mb-5'}`}>
                    {!isStacked && avatar && (
                        <Image source={{ uri: avatar }} className="w-full h-full rounded-full" resizeMode="cover" />
                    )}
                </View>
            )}

            {/* Message Content */}
            <View className={`flex-col gap-1 max-w-[80%] ${isIncoming ? 'items-start' : 'items-end'}`}>

                {/* Bong bóng chữ */}
                {text && text.trim() !== '' && (
                    isIncoming ? (
                        <TouchableOpacity
                            onLongPress={onLongPress}
                            activeOpacity={0.85}
                            className={`px-4 py-2.5 rounded-2xl ${isStacked ? '' : 'rounded-bl-none'} border ${
                                isDark ? 'bg-white/10 border-white/5' : 'bg-slate-200/80 border-slate-300/40'
                            }`}
                        >
                            <Text className="text-slate-800 dark:text-slate-100 text-[15px] leading-5">{text}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onLongPress={onLongPress}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#7C3AED', '#F43F5E']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ borderRadius: 18, borderBottomRightRadius: isStacked ? 18 : 2 }}
                                className={`px-4 py-2.5 shadow-md`}
                            >
                                <Text className="text-white text-[15px] leading-5">{text}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )
                )}

                {/* Danh sách ảnh đính kèm */}
                {files && files.length > 0 && (
                    <TouchableOpacity 
                        activeOpacity={0.95} 
                        onLongPress={onLongPress}
                        className={`mt-1 w-64 rounded-2xl overflow-hidden border border-slate-300 dark:border-white/10`}
                    >
                        <MultiImageGrid 
                            images={files.map((file, idx) => ({
                                id: file.filename || String(idx),
                                url: file.url,
                            }))}
                        />
                    </TouchableOpacity>
                )}

                {/* Hiển thị Reactions */}
                {reactions && Object.keys(reactions).length > 0 && (
                    <View className={`flex-row items-center gap-1 mt-1 px-2 py-0.5 rounded-full ${
                        isDark ? 'bg-white/10' : 'bg-slate-200/60'
                    }`}>
                        {Object.entries(reactions).map(([emoji, userIds]) => (
                            userIds.length > 0 && (
                                <View key={emoji} className="flex-row items-center gap-0.5 mr-1">
                                    <Text className="text-xs">{emoji}</Text>
                                    {userIds.length > 1 && (
                                        <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{userIds.length}</Text>
                                    )}
                                </View>
                            )
                        ))}
                    </View>
                )}

                {/* Thời gian & Trạng thái */}
                {!hideTime && (
                    <View className={`flex-row items-center gap-1 ${isIncoming ? 'ml-2' : 'mr-2'} mt-0.5`}>
                        {!isIncoming && seen && <Text className="text-[#06B6D4] text-[10px] font-medium">Đã xem</Text>}
                        <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-medium">{time}</Text>
                    </View>
                )}
            </View>
        </View>
    );
}
