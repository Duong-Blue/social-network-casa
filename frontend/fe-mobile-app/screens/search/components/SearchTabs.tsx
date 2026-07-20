import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'nativewind';
import { SearchType } from '@/features/search/type/search.types';

const TABS: { key: SearchType; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'users', label: 'Người dùng' },
  { key: 'posts', label: 'Bài viết' },
];

interface Props {
  active: SearchType;
  onChange: (type: SearchType) => void;
  totalUsers?: number;
  totalPosts?: number;
}

export default function SearchTabs({ active, onChange, totalUsers, totalPosts }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="flex-row px-4 mb-4 gap-2">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.7}
            onPress={() => onChange(tab.key)}
            className={`px-4 py-2 rounded-full ${
              isActive
                ? 'bg-[#7c3bed]'
                : isDark
                  ? 'bg-[#1A1525] border border-white/5'
                  : 'bg-slate-200 border border-slate-300'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                isActive ? 'text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {tab.label}
              {tab.key === 'users' && totalUsers !== undefined
                ? ` (${totalUsers})`
                : tab.key === 'posts' && totalPosts !== undefined
                  ? ` (${totalPosts})`
                  : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
