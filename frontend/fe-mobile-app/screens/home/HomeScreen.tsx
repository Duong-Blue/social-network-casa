import React, { useState, useCallback } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from "nativewind";

import HomeHeader from './components/HomeHeader';
import MainFeed from './components/MainFeed';
import NotificationPanel from './components/NotificationPanel';

export default function HomeScreen() {
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const { colorScheme } = useColorScheme();

    return (
        <View className="flex-1 bg-[#f7f6f8] dark:bg-[#0F0A1F]">
            <LinearGradient
                colors={colorScheme === 'dark' ? ['#0F0A1F', '#2A0E4D'] : ['#f7f6f8', '#ffffff']}
                style={{ flex: 1 }}
            >
                <HomeHeader onOpenNotification={() => setIsNotificationOpen(true)} />
                <View className="flex-1 mt-3">
                    <MainFeed />
                </View>
            </LinearGradient>

            {/* Notification Panel Modal-like Component */}
            <NotificationPanel 
                isVisible={isNotificationOpen} 
                onClose={() => setIsNotificationOpen(false)} 
            />
        </View>
    );
}