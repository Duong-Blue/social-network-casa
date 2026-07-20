import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PostResponse } from '@/features/post/type/post.types';

interface PostActionsProps {
  post: PostResponse;
  isDark: boolean;
  likeScale: Animated.Value;
  showComments: boolean;
  onLike: () => void;
  onToggleComments: () => void;
  onSave: () => void;
  onShare: () => void;
}

export function PostActions({
  post,
  isDark,
  likeScale,
  showComments,
  onLike,
  onToggleComments,
  onSave,
  onShare,
}: PostActionsProps) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-6">
        {/* Like Button */}
        <TouchableOpacity onPress={onLike} activeOpacity={0.7} className="flex-row items-center gap-1">
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <MaterialIcons
              name={post.liked ? 'favorite' : 'favorite-border'}
              size={26}
              color={post.liked ? '#F43F5E' : (isDark ? '#CBD5E1' : '#475569')}
            />
          </Animated.View>
          <Text className={`text-sm font-medium ${post.liked ? 'text-[#F43F5E]' : 'text-slate-500 dark:text-slate-300'}`}>
            {post.numberLike}
          </Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center gap-1"
          onPress={onToggleComments}
        >
          <MaterialIcons
            name={showComments ? 'chat-bubble' : 'chat-bubble-outline'}
            size={24}
            color={showComments ? '#8B5CF6' : (isDark ? '#CBD5E1' : '#475569')}
          />
          <Text className={`text-sm font-medium ${showComments ? 'text-[#8B5CF6]' : 'text-slate-500 dark:text-slate-300'}`}>
            {post.numberComment}
          </Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center gap-1"
          onPress={onShare}
        >
          <MaterialIcons
            name="share"
            size={24}
            color={isDark ? '#CBD5E1' : '#475569'}
          />
          <Text className="text-sm font-medium text-slate-500 dark:text-slate-300">
            {post.numberShare || 0}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <TouchableOpacity onPress={onSave} activeOpacity={0.7}>
        <MaterialIcons
          name={post.isSaved ? 'bookmark' : 'bookmark-border'}
          size={26}
          color={post.isSaved ? '#8B5CF6' : (isDark ? '#CBD5E1' : '#475569')}
        />
      </TouchableOpacity>
    </View>
  );
}
