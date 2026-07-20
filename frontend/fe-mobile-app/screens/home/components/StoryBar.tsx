import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { getFriendStoriesThunk } from '@/features/story/thunk/story.thunk';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import { useRouter } from 'expo-router';
import { UserStoryGroup } from '@/features/story/type/story.types';
import { useColorScheme } from 'nativewind';

export default function StoryBar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(state => state.auth.user);
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const { stories = [], isLoading } = useAppSelector(state => state.story);
  const { following = [] } = useAppSelector(state => state.interaction);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (isAuthenticated && currentUser?.userId) {
      dispatch(getFriendStoriesThunk(currentUser.userId));
    }
  }, [dispatch, currentUser?.userId, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <View className="py-3 px-4" style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)' }}>
        <View className="flex-row items-center justify-between bg-slate-100 dark:bg-[#1E1445] p-3 rounded-2xl">
          <View className="flex-1 mr-3">
            <Text className="text-slate-700 dark:text-slate-200 text-xs font-semibold">Bạn chưa đăng nhập</Text>
            <Text className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">Vui lòng đăng nhập để sử đụng đầy đủ chức năng</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            className="bg-[#038eff] px-4 py-2 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-white text-xs font-bold">Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentUserAvatarUri = currentUser?.profilePicture
    ? getMediaUrl(currentUser.profilePicture)
    : `https://ui-avatars.com/api/?name=${currentUser?.username || 'U'}&background=random&color=fff`;

  // Component tĩnh: Nút "Tạo tin" luôn xuất hiện ở đầu tiên
  const renderCreateStoryItem = () => (
    <TouchableOpacity
      className="items-center mr-4"
      activeOpacity={0.8}
      onPress={() => { try { router.push('/create-story'); } catch { } }}
    >
      <View className="relative">
        <View className="p-[2px] rounded-full border border-slate-300 dark:border-slate-700" style={{ backgroundColor: isDark ? '#0F0A1F' : '#f7f6f8' }}>
          <Image
            source={{ uri: currentUserAvatarUri }}
            style={{ width: 56, height: 56, borderRadius: 999, opacity: 0.7 }}
            resizeMode="cover"
          />
        </View>
        <View className="absolute bottom-0 right-0 bg-[#7c3bed] w-5 h-5 rounded-full items-center justify-center" style={{ borderWidth: 2, borderColor: isDark ? '#0F0A1F' : '#f7f6f8' }}>
          <MaterialIcons name="add" size={11} color="white" />
        </View>
      </View>
      <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium w-14 text-center" numberOfLines={1}>
        Tin mới
      </Text>
    </TouchableOpacity>
  );

  const renderStoryItem = (group: UserStoryGroup) => {
    const isCurrentUser = group.userId === currentUser?.userId;
    // Tìm thông tin user an toàn
    let user = isCurrentUser ? currentUser : (following || []).find(f => f?.userId === group.userId);

    const displayName = isCurrentUser ? 'Tin của bạn' : (user?.username || 'User');
    const avatarUri = user?.profilePicture
      ? getMediaUrl(user.profilePicture)
      : `https://ui-avatars.com/api/?name=${user?.username || 'U'}&background=random&color=fff`;

    // Kiểm tra xem đã xem hết story của người này chưa
    let isAllViewed = true;
    if (group && group.stories && group.stories.length > 0 && currentUser?.userId) {
      isAllViewed = group.stories.every(story => story?.viewers?.includes(currentUser.userId));
    }

    const handlePress = () => {
      try { router.push({ pathname: '/view-story', params: { userId: group.userId } }); } catch { }
    };

    return (
      <TouchableOpacity
        key={`story-group-${group.userId}`}
        className="items-center mr-4"
        activeOpacity={0.8}
        onPress={handlePress}
      >
        <View className="relative">
          {!isAllViewed ? (
            <LinearGradient
              colors={['#1D4ED8', '#EF4444']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={{ padding: 2, borderRadius: 999 }}
            >
              <View style={{ padding: 2, borderRadius: 999, backgroundColor: isDark ? '#0F0A1F' : '#f7f6f8' }}>
                <Image
                  source={{ uri: avatarUri }}
                  className="w-[56px] h-[56px] rounded-full"
                  resizeMode="cover"
                />
              </View>
            </LinearGradient>
          ) : (
            <View style={{ padding: 2, borderRadius: 999, borderWidth: 1, borderColor: isDark ? '#334155' : '#CBD5E1', opacity: 0.6, backgroundColor: isDark ? '#0F0A1F' : '#f7f6f8' }}>
              <Image
                source={{ uri: avatarUri }}
                className="w-[56px] h-[56px] rounded-full"
                resizeMode="cover"
              />
            </View>
          )}
        </View>
        <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium w-14 text-center" numberOfLines={1}>
          {displayName}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading && (!stories || stories.length === 0)) {
    return (
      <View className="py-3" style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)' }}>
        <View className="flex-row px-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="items-center gap-2">
              <View className="w-[60px] h-[60px] rounded-full bg-slate-300 dark:bg-[#1E1445]" />
              <View className="w-12 h-2 rounded bg-slate-300 dark:bg-[#1E1445]" />
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Tách nhóm của chính mình ra để đưa lên trước các bạn bè khác (nếu có)
  const myGroup = (stories || []).find(g => g?.userId === currentUser?.userId);
  const friendGroups = (stories || []).filter(g => g?.userId !== currentUser?.userId);

  return (
    <View className="py-3" style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)', backgroundColor: isDark ? 'transparent' : undefined }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
        decelerationRate="fast"
        snapToInterval={72}
      >
        {/* 1. Nút tạo tin hiển thị nếu đã đăng nhập */}
        {currentUser?.userId ? renderCreateStoryItem() : null}

        {/* 2. Tin của chính mình (chỉ hiển thị nếu đã có ít nhất 1 tin) */}
        {myGroup && renderStoryItem(myGroup)}

        {/* 3. Danh sách story của bạn bè */}
        {friendGroups.map(group => renderStoryItem(group))}
      </ScrollView>
    </View>
  );
}
