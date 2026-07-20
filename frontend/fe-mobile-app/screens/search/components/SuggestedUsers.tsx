import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { getSuggestedUsersThunk } from '@/features/account/thunk/account.thunk';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';

export default function SuggestedUsers() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const currentUser = useAppSelector(state => state.auth.user);
    const { suggestedUsers = [], isLoading } = useAppSelector(state => state.account);
    useColorScheme();

    useEffect(() => {
        dispatch(getSuggestedUsersThunk({ page: 1, size: 20 }));
    }, [dispatch]);

    // Lọc bỏ chính mình khỏi danh sách gợi ý
    const filteredUsers = (suggestedUsers || []).filter((u: any) => u && u.userId !== currentUser?.userId);

    if (isLoading && suggestedUsers.length === 0) {
        return (
            <View className="py-10 items-center justify-center">
                <ActivityIndicator color="#7c3bed" />
            </View>
        );
    }

    if (filteredUsers.length === 0) return null;

    return (
        <View className="mb-6">
            <View className="flex-row justify-between items-center px-4 mb-4">
                <Text className="text-slate-800 dark:text-white text-base font-bold">Người dùng bạn có thể biết</Text>
                <TouchableOpacity>
                    <Text className="text-[#06B6D4] text-xs font-bold">Xem tất cả</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
            >
                {filteredUsers.map((item) => (
                    <View 
                        key={item.userId} 
                        className="bg-white dark:bg-[#1A1525] p-4 rounded-3xl items-center mr-3 border border-slate-200 dark:border-white/5 w-36"
                    >
                        <View className="relative mb-3">
                            <Image
                                source={{ uri: getMediaUrl(item.profilePicture) || `https://ui-avatars.com/api/?name=${item.username}&background=random` }}
                                className="w-16 h-16 rounded-full"
                                resizeMode="cover"
                            />
                            <View className="absolute bottom-0 right-0 w-4 h-4 bg-[#06B6D4] rounded-full border-2 border-white dark:border-[#1A1525]" />
                        </View>
                        
                        <Text className="text-slate-800 dark:text-white text-sm font-bold text-center" numberOfLines={1}>
                            {item.username}
                        </Text>
                        <Text className="text-slate-400 dark:text-slate-500 text-[10px] mb-4 text-center" numberOfLines={1}>
                            @{item.username}
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            className="w-full"
                            onPress={() => router.push(`/user/${item.userId}`)}
                        >
                            <LinearGradient
                                colors={['#7c3bed', '#ec4899']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="py-2 rounded-xl items-center"
                            >
                                <Text className="text-white text-[10px] font-bold">Xem trang</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}
