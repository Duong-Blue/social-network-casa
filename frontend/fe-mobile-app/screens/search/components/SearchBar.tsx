import React from 'react';
import { View, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing: () => void;
}

export default function SearchBar({ value, onChangeText, onSubmitEditing }: Props) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      className="px-4 pb-3 border-b border-black/5 dark:border-white/10"
      style={{
        paddingTop: 10,
        backgroundColor: isDark ? '#0F0A1F' : '#f7f6f8',
      }}
    >
      <View className="flex-row items-center bg-slate-200 dark:bg-[#1A1525] rounded-full px-4 py-3 border border-slate-300 dark:border-white/5">
        <MaterialIcons name="search" size={24} color={isDark ? '#94A3B8' : '#64748B'} />
        <TextInput
          className="flex-1 ml-3 text-base font-medium text-slate-800 dark:text-white py-0"
          placeholder="Tìm kiếm người dùng, bài viết..."
          placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
          selectionColor="#7c3bed"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="search"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <MaterialIcons
            name="close"
            size={20}
            color={isDark ? '#94A3B8' : '#64748B'}
            onPress={() => onChangeText('')}
          />
        )}
      </View>
    </View>
  );
}
