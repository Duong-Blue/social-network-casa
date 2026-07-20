import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import { useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SearchUser } from '@/features/search/type/search.types';

interface Props {
  users: SearchUser[];
}

export default function UserResults({ users }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  if (users.length === 0) return null;

  return (
    <View className="mb-6">
      <Text className="text-slate-800 dark:text-white text-base font-bold px-4 mb-3">
        Người dùng
      </Text>
      {users.map((user) => (
        <TouchableOpacity
          key={user.userId}
          activeOpacity={0.7}
          onPress={() => router.push(`/user/${user.userId}`)}
          className="flex-row items-center px-4 py-3 mx-4 mb-2 bg-white dark:bg-[#1A1525] rounded-2xl border border-slate-200 dark:border-white/5"
        >
          <Image
            source={{
              uri:
                getMediaUrl(user.profilePicture) ||
                `https://ui-avatars.com/api/?name=${user.username}&background=random&color=fff`,
            }}
            className="w-12 h-12 rounded-full"
            resizeMode="cover"
          />
          <View className="flex-1 ml-3">
            <Text className="text-slate-800 dark:text-white font-bold text-sm" numberOfLines={1}>
              {user.username}
            </Text>
            <Text className="text-slate-400 dark:text-slate-500 text-xs" numberOfLines={1}>
              @{user.username}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}
