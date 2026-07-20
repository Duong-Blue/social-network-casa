import React from 'react';
import { View, Text, TouchableOpacity, Image, Modal, Pressable, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { useRouter } from 'expo-router';
import { deletePostThunk } from '@/features/post/thunk/post.thunk';
import { PostResponse } from '@/features/post/type/post.types';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface PostHeaderProps {
  post: PostResponse;
  isDark: boolean;
  hasUnviewedStory: boolean;
  hasStory?: boolean;
  showOptions: boolean;
  setShowOptions: (v: boolean) => void;
}

export function PostHeader({ post, isDark, hasUnviewedStory, hasStory, showOptions, setShowOptions }: PostHeaderProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(state => state.auth.user);

  const avatarUri = post.user.profilePicture
    ? getMediaUrl(post.user.profilePicture)
    : `https://ui-avatars.com/api/?name=${post.user.username}&background=random`;

  const handleAvatarPress = () => {
    if (hasStory) {
      try {
        router.push({
          pathname: '/view-story',
          params: {
            userId: post.user.userId,
            username: post.user.username,
            profilePicture: post.user.profilePicture || ''
          }
        });
      } catch {}
    } else {
      try { router.push(`/user/${post.user.userId}`); } catch {}
    }
  };

  const handleNamePress = () => {
    try {
      router.push(`/user/${post.user.userId}`);
    } catch {}
  };
 
  return (
    <View className="flex-row items-center justify-between p-4 pb-2">
      <View className="flex-row items-center gap-3 flex-1">
        <TouchableOpacity
          onPress={handleAvatarPress}
          activeOpacity={0.8}
        >
          {hasUnviewedStory ? (
            <LinearGradient
              colors={['#1D4ED8', '#EF4444']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={{ padding: 2, borderRadius: 999 }}
            >
              <View style={{ padding: 2, borderRadius: 999, backgroundColor: isDark ? '#0F0A1F' : '#FFFFFF' }}>
                <Image
                  source={{ uri: avatarUri }}
                  style={{ width: 40, height: 40, borderRadius: 999 }}
                  resizeMode="cover"
                />
              </View>
            </LinearGradient>
          ) : (
            <Image
              source={{ uri: avatarUri }}
              style={{ width: 40, height: 40, borderRadius: 999, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }}
              resizeMode="cover"
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          className="flex-1"
          onPress={handleNamePress}
          activeOpacity={0.7}
        >
          <Text className="text-sm font-bold text-slate-800 dark:text-white">{post.user.username}</Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            {dayjs(post.createdAt).fromNow()}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => setShowOptions(true)} className="p-1 ml-2">
        <MaterialIcons name="more-horiz" size={24} color={isDark ? '#94A3B8' : '#64748B'} />
      </TouchableOpacity>

      {/* Options Menu Modal */}
      <Modal
        visible={showOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <Pressable className="flex-1" onPress={() => setShowOptions(false)}>
          <View
            className="absolute right-10 top-24 bg-white dark:bg-[#1A1625] rounded-2xl p-2 w-48"
            style={{ borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: isDark ? 0.5 : 0.1, shadowRadius: 20, elevation: 15 }}
          >
            {String(currentUser?.userId) === String(post.user?.userId) ? (
              <>
                <TouchableOpacity
                  onPress={() => { setShowOptions(false); try { router.push({ pathname: '/(tab)/create-post', params: { postId: post.postId } } as any); } catch {} }}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : undefined }}
                >
                  <MaterialIcons name="edit" size={20} color="#8B5CF6" />
                  <Text className="text-slate-800 dark:text-white font-medium">Sửa bài viết</Text>
                </TouchableOpacity>
                <View className="h-[1px] mx-2" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }} />
                <TouchableOpacity
                  onPress={() => { setShowOptions(false); Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa bài viết này không?', [{ text: 'Hủy', style: 'cancel' }, { text: 'Xóa', style: 'destructive', onPress: () => dispatch(deletePostThunk(post.postId)) }]); }}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : undefined }}
                >
                  <MaterialIcons name="delete-outline" size={20} color="#F43F5E" />
                  <Text className="text-[#F43F5E] font-medium">Xóa bài viết</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => { setShowOptions(false); Alert.alert('Thông báo', 'Chúng tôi sẽ ẩn bớt các bài viết tương tự'); }}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : undefined }}
                >
                  <MaterialIcons name="visibility-off" size={20} color="#94A3B8" />
                  <Text className="text-slate-800 dark:text-white font-medium">Không quan tâm</Text>
                </TouchableOpacity>
                <View className="h-[1px] mx-2" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }} />
                <TouchableOpacity
                  onPress={() => { setShowOptions(false); Alert.alert('Báo cáo', 'Cảm ơn bạn đã phản hồi, chúng tôi sẽ xem xét bài viết này'); }}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : undefined }}
                >
                  <MaterialIcons name="report-problem" size={20} color="#F59E0B" />
                  <Text className="text-slate-800 dark:text-white font-medium">Báo cáo bài viết</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
