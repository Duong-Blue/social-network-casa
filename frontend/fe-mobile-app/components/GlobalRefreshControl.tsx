import React from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';
import { useColorScheme } from 'nativewind';

interface GlobalRefreshControlProps extends Omit<RefreshControlProps, 'refreshing'> {
    refreshing: boolean;
    onRefresh: () => void;
}

export default function GlobalRefreshControl({ refreshing, onRefresh, ...props }: GlobalRefreshControlProps) {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B5CF6"
            colors={['#8B5CF6']}
            progressBackgroundColor={isDark ? '#1F1A2F' : '#FFFFFF'}
            {...props}
        />
    );
}
