import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";

const ProfileHeader = () => {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <View
            className="flex-row items-center justify-between px-4 pb-3"
            style={{ paddingTop: 10, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
        >
            <View className="w-10" />

            <Text className="text-lg font-bold tracking-wide text-slate-800 dark:text-white">Trang cá nhân</Text>

            <TouchableOpacity
                onPress={() => { try { router.push('/settings'); } catch {} }}
                className="w-10 h-10 rounded-full items-center justify-center"
                activeOpacity={0.7}
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
            >
                <MaterialIcons name="more-vert" size={24} color={isDark ? 'white' : '#1E293B'} />
            </TouchableOpacity>
        </View>
    );
};

export default ProfileHeader;
