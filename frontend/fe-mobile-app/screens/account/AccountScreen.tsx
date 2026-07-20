import React, { useState, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useColorScheme } from "nativewind";
import { useAppDispatch } from '@/store/hook';
import { getProfileThunk } from '@/features/account/thunk/account.thunk';
import { getAllPostsByUserIdThunk, getSavedPostsThunk } from '@/features/post/thunk/post.thunk';
import GlobalRefreshControl from '@/components/GlobalRefreshControl';

import ProfileHeader from './components/ProfileHeader';
import ProfileInfo from './components/ProfileInfo';
import ProfileGrid from './components/ProfileGrid';

export default function AccountScreen() {
    const dispatch = useAppDispatch();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const { colorScheme } = useColorScheme();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        if (!currentUser?.userId) return;
        setRefreshing(true);
        try {
            await Promise.all([
                dispatch(getProfileThunk(currentUser.userId)).unwrap(),
                dispatch(getAllPostsByUserIdThunk({ page: 1, size: 20, userId: currentUser.userId })).unwrap(),
                dispatch(getSavedPostsThunk({ page: 1, size: 20 })).unwrap(),
            ]);
        } catch (error) {
            console.error('Failed to refresh account data:', error);
        } finally {
            setRefreshing(false);
        }
    }, [dispatch, currentUser?.userId]);

    return (
        <View className="flex-1 bg-[#f7f6f8] dark:bg-[#0F0A1F] relative overflow-hidden">
            {/* Background Glow Effects */}
            <View className="absolute -top-20 -left-20 w-64 h-64 bg-[#7c40ed]/10 dark:bg-[#7c40ed]/20 rounded-full" style={{ filter: 'blur(100px)' } as any} pointerEvents="none" />
            <View className="absolute top-40 -right-20 w-72 h-72 bg-[#06b6d4]/5 dark:bg-[#06b6d4]/10 rounded-full" style={{ filter: 'blur(100px)' } as any} pointerEvents="none" />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
                refreshControl={
                    <GlobalRefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                <ProfileHeader />
                {/* ── Chỉ render Info và Grid khi đã có currentUser ── */}
                {currentUser?.userId ? (
                    <>
                        <ProfileInfo userId={currentUser.userId} />
                        <ProfileGrid userId={currentUser.userId} />
                    </>
                ) : (
                    <View className="flex-1 justify-center items-center py-20">
                        <ActivityIndicator color="#7c40ed" />
                    </View>
                )}
            </ScrollView>
        </View>
    );
}