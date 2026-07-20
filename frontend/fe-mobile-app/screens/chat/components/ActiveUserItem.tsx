import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import { accountService } from '@/features/account/service/account.service';

interface ActiveUserItemProps {
    userId: string;
    conversationId?: string;
}

export default function ActiveUserItem({ userId, conversationId }: ActiveUserItemProps) {
    const router = useRouter();
    const [profile, setProfile] = useState<{ username: string; profilePicture?: string } | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        if (userId) {
            accountService.getProfile(userId)
                .then(res => {
                    if (isMounted.current && res?.data) {
                        setProfile({
                            username: res.data.username || 'User',
                            profilePicture: res.data.profilePicture || undefined,
                        });
                    }
                })
                .catch(() => {});
        }
        return () => {
            isMounted.current = false;
        };
    }, [userId]);

    const displayName = profile?.username || '...';
    const avatarUri = getMediaUrl(profile?.profilePicture) || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=06B6D4&color=fff`;

    const handlePress = () => {
        if (conversationId) {
            router.push(`/chat/${conversationId}`);
        }
    };

    return (
        <TouchableOpacity 
            className="items-center mr-4" 
            activeOpacity={0.8}
            onPress={handlePress}
            disabled={!conversationId}
        >
            <View className="relative">
                <View className="w-14 h-14 rounded-full border-2 border-[#06B6D4] p-[2px]">
                    <Image
                        source={{ uri: avatarUri }}
                        className="w-full h-full rounded-full"
                    />
                </View>
                <View className="absolute bottom-0 right-0 h-4 w-4 bg-[#06B6D4] rounded-full border-2 border-[#f7f6f8] dark:border-[#0F0A1F]" />
            </View>
            <Text className="text-slate-600 dark:text-slate-400 text-[10px] mt-1 font-medium max-w-[60px] text-center" numberOfLines={1}>
                {displayName}
            </Text>
        </TouchableOpacity>
    );
}
