import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from "nativewind";
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

import { useAppSelector } from '@/store/hook';

interface HomeHeaderProps {
    onOpenNotification?: () => void;
}

export default function HomeHeader({ onOpenNotification }: HomeHeaderProps) {
    const insets = useSafeAreaInsets();
    const { unreadCount } = useAppSelector(state => state.notification);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <View
            className="flex-row items-center justify-between px-4 pb-3"
            style={{ paddingTop: 10, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
        >
            <View className="flex-row items-center gap-2 ml-4">
                <MaskedView
                    maskElement={
                        <Text
                            style={{
                                fontSize: 28,
                                fontWeight: '900',
                                letterSpacing: 2,
                            }}
                        >
                            CASA
                        </Text>
                    }
                >
                    <LinearGradient
                        colors={['#ac0d71ff', '#038effff']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text
                            style={{
                                fontSize: 28,
                                fontWeight: '900',
                                letterSpacing: 2,
                                opacity: 0,
                            }}
                        >
                            CASA
                        </Text>
                    </LinearGradient>
                </MaskedView>
            </View>
            <View className="flex-row items-center gap-4">
                <TouchableOpacity
                    onPress={onOpenNotification}
                    activeOpacity={0.7}
                    className="relative p-2 rounded-full bg-slate-100"
                    style={isDark ? { backgroundColor: 'rgba(255,255,255,0.05)' } : {}}
                >
                    <MaterialIcons name="notifications" size={24} color={isDark ? "#CBD5E1" : "#475569"} />
                    {unreadCount > 0 && (
                        <View className="absolute top-1 right-1 w-4 h-4 bg-accent-pink rounded-full items-center justify-center border border-white dark:border-[#0F0A1F]">
                            <Text className="text-white text-[8px] font-bold">{unreadCount > 9 ? '9+' : unreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
