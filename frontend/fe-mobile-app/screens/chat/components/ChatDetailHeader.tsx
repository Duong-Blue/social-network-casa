import React from 'react';
import { View, Text, TouchableOpacity, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import { useColorScheme } from 'nativewind';

interface ChatDetailHeaderProps {
    name?: string;
    avatar?: string;
    online?: boolean;
}

export default function ChatDetailHeader({ name, avatar, online }: ChatDetailHeaderProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <View
            className="flex-row items-center justify-between px-4 pb-3 z-20 border-b border-black/5 dark:border-white/10"
            style={{
                paddingTop: 10,
                backgroundColor: isDark ? 'rgba(15, 10, 31, 0.9)' : 'rgba(247, 246, 248, 0.9)'
            }}
        >
            <View className="flex-row items-center gap-3">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="p-2 -ml-2 rounded-full active:bg-black/5 dark:active:bg-white/10"
                >
                    <MaterialIcons name="arrow-back" size={24} color={isDark ? 'white' : '#1E293B'} />
                </TouchableOpacity>

                <View className="relative">
                    <Image
                        source={{ uri: getMediaUrl(avatar) || `https://ui-avatars.com/api/?name=${name || 'U'}&background=random` }}
                        className="h-10 w-10 rounded-full"
                        style={{ borderWidth: 2, borderColor: isDark ? '#0F0A1F' : '#f7f6f8' }}
                        resizeMode="cover"
                    />
                    {online && <View className="absolute bottom-0 right-0 h-3 w-3 bg-[#06B6D4] rounded-full border-2" style={{ borderColor: isDark ? '#0F0A1F' : '#f7f6f8' }} />}
                </View>

                <View>
                    <Text className="text-base font-bold leading-tight text-slate-800 dark:text-white">{name || 'Đang tải...'}</Text>
                    <Text className={`${online ? 'text-[#06B6D4]' : 'text-slate-500 dark:text-slate-400'} text-xs font-medium`}>
                        {online ? 'Đang hoạt động' : 'Ngoại tuyến'}
                    </Text>
                </View>
            </View>
        </View>
    );
}
