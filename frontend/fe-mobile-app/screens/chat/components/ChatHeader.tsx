import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

export default function ChatHeader() {
    const insets = useSafeAreaInsets();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <View
            className="px-4 pb-3 z-20 border-b border-black/5 dark:border-white/5"
            style={{
                paddingTop: 10,
                backgroundColor: isDark ? 'rgba(15, 10, 31, 0.9)' : 'rgba(247, 246, 248, 0.9)'
            }}
        >
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                    <Text className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Messages</Text>
                </View>

                <TouchableOpacity className="h-10 w-10 rounded-full items-center justify-center bg-transparent active:bg-black/5 dark:active:bg-white/10">
                    <MaterialIcons name="settings" size={24} color={isDark ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity 
                activeOpacity={0.7}
                className="relative w-full rounded-full flex-row items-center bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 px-4 py-3"
            >
                <MaterialIcons name="search" size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                <Text className="text-slate-500 dark:text-slate-400 text-sm ml-2">Tìm kiếm cuộc hội thoại...</Text>
            </TouchableOpacity>
        </View>
    );
}
