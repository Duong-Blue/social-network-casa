import React from 'react';
import { View, Text, TouchableOpacity, Image, FlatList } from 'react-native';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import { useColorScheme } from 'nativewind';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PostResponse } from '@/features/post/type/post.types';

interface Props {
  posts: PostResponse[];
}

export default function PostResults({ posts }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  if (posts.length === 0) return null;

  const hasMedia = (post: PostResponse) => post.mediaUrls && post.mediaUrls.length > 0;

  return (
    <View className="mb-6">
      <Text className="text-slate-800 dark:text-white text-base font-bold px-4 mb-3">
        Bài viết
      </Text>
      {posts.map((post) => (
        <TouchableOpacity
          key={post.postId}
          activeOpacity={0.8}
          onPress={() => router.push(`/post/${post.postId}` as any)}
          className="mx-4 mb-3 bg-white dark:bg-[#1A1525] rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden"
        >
          {hasMedia(post) && (
            <Image
              source={{ uri: getMediaUrl(post.mediaUrls[0]) }}
              className="w-full h-48"
              resizeMode="cover"
            />
          )}
          <View className="p-4">
            <View className="flex-row items-center mb-2">
              <Image
                source={{
                  uri:
                    getMediaUrl(post.user?.profilePicture) ||
                    `https://ui-avatars.com/api/?name=${post.user?.username || 'U'}&background=random&color=fff`,
                }}
                className="w-6 h-6 rounded-full"
                resizeMode="cover"
              />
              <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium ml-2">
                {post.user?.username}
              </Text>
            </View>
            <Text className="text-slate-800 dark:text-white text-sm" numberOfLines={2}>
              {post.content}
            </Text>
            <View className="flex-row items-center mt-2 gap-4">
              <View className="flex-row items-center gap-1">
                <MaterialIcons name="favorite-border" size={14} color="#94A3B8" />
                <Text className="text-slate-400 dark:text-slate-500 text-xs">{post.numberLike}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <MaterialIcons name="chat-bubble-outline" size={14} color="#94A3B8" />
                <Text className="text-slate-400 dark:text-slate-500 text-xs">{post.numberComment}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}
