import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Alert, Animated, Platform, Share, Image, TouchableOpacity } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { useRouter } from 'expo-router';
import { likePostThunk } from '@/features/interaction/thunk/interaction.thunk';
import { toggleSavePostThunk, sharePostThunk, createPostThunk, getAllPostsThunk } from '@/features/post/thunk/post.thunk';
import { PostResponse } from '@/features/post/type/post.types';
import MultiImageGrid, { PostImage } from './MultiImageGrid';
import { PostHeader } from './PostHeader';
import { PostActions } from './PostActions';
import { CommentSection } from './CommentSection';
import MentionText from '@/components/MentionText';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import dayjs from 'dayjs';

// ── Floating Heart Overlay ──
function FloatingHeart({ visible, scale, opacity }: { visible: boolean; scale: Animated.Value; opacity: Animated.Value }) {
  if (!visible) return null;
  return (
    <Animated.View
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center', alignItems: 'center',
        transform: [{ scale }], opacity,
      }}
      pointerEvents="none"
    >
      <MaterialIcons
        name="favorite"
        size={80}
        color="white"
        style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 }}
      />
    </Animated.View>
  );
}

const EMPTY_ARRAY: any[] = [];

export function PostItem({ post, isActive }: { post: PostResponse; isActive?: boolean }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAppSelector(state => state.auth);
  const stories = useAppSelector(state => state.story.stories || []);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Local state for optimistic like update
  const [liked, setLiked] = useState(post.liked);
  const [numberLike, setNumberLike] = useState(post.numberLike);

  const likeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLiked = useRef(post.liked);
  const likeApiPendingRef = useRef(false); // Cờ chặn request song song

  // Đồng bộ lại local state khi prop post thay đổi từ Redux store
  useEffect(() => {
    setLiked(post.liked);
    setNumberLike(post.numberLike);
    isInitialLiked.current = post.liked;
  }, [post.liked, post.numberLike]);

  // Phục vụ cleanup gửi request cuối cùng khi unmount nếu còn timeout chạy dở
  const stateRef = useRef({ liked, isInitialLiked: post.liked, postId: post.postId, userId: currentUser?.userId, dispatch });
  useEffect(() => {
    stateRef.current = { liked, isInitialLiked: post.liked, postId: post.postId, userId: currentUser?.userId, dispatch };
  }, [liked, post.liked, post.postId, currentUser?.userId, dispatch]);

  useEffect(() => {
    return () => {
      if (likeTimeoutRef.current) {
        clearTimeout(likeTimeoutRef.current);
        const { liked: finalLiked, isInitialLiked: initLiked, postId, userId, dispatch: disp } = stateRef.current;
        if (finalLiked !== initLiked && userId) {
          disp(likePostThunk({ postId, userId }));
        }
      }
    };
  }, []);

  // Story gradient check
  const postUserStoryGroup = stories.find(g => String(g.userId) === String(post.user.userId));
  const hasStory = !!postUserStoryGroup && postUserStoryGroup.stories && postUserStoryGroup.stories.length > 0;
  const hasUnviewedStory = postUserStoryGroup
    ? postUserStoryGroup.stories.some(s => !s?.viewers?.includes(currentUser?.userId ?? ''))
    : false;

  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Like animation
  const likeScale = useRef(new Animated.Value(1)).current;
  const [showHeart, setShowHeart] = useState(false);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(1)).current;

  const showFloatingHeart = () => {
    setShowHeart(true);
    heartScale.setValue(0);
    heartOpacity.setValue(1);
    Animated.parallel([
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
      Animated.timing(heartOpacity, { toValue: 0, duration: 600, useNativeDriver: true, delay: 200 }),
    ]).start(() => setShowHeart(false));
  };

  const animateLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(likeScale, { toValue: 1.35, useNativeDriver: true, friction: 3 }),
      Animated.spring(likeScale, { toValue: 1, useNativeDriver: true, friction: 3 }),
    ]).start();
  };

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập để sử dụng tính năng này',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }
    action();
  };

  const runLikeApi = async (targetLikedState: boolean) => {
    if (!currentUser) return;

    // 1. Nếu đang có request like/unlike khác chưa chạy xong, xếp hàng đợi thêm 200ms
    if (likeApiPendingRef.current) {
      if (likeTimeoutRef.current) {
        clearTimeout(likeTimeoutRef.current);
      }
      likeTimeoutRef.current = setTimeout(() => {
        runLikeApi(stateRef.current.liked);
      }, 200);
      return;
    }

    // 2. Nếu trạng thái tim cuối cùng trùng với trạng thái lưu trên server, không cần gửi API nữa
    if (targetLikedState === isInitialLiked.current) {
      return;
    }

    likeApiPendingRef.current = true;
    try {
      // dispatch thunk và đợi phản hồi
      await dispatch(likePostThunk({ postId: post.postId, userId: currentUser.userId })).unwrap();
      // Sau khi thành công, isInitialLiked.current sẽ được tự động cập nhật qua useEffect đồng bộ post
    } catch (error) {
      console.warn('Failed to sync like state to server, rolling back UI:', error);
      // Rollback UI về trạng thái an toàn cuối cùng từ server nếu có lỗi 400 xảy ra
      setLiked(isInitialLiked.current);
      setNumberLike(post.numberLike);
    } finally {
      likeApiPendingRef.current = false;
    }
  };

  const handleLike = () => {
    requireAuth(() => {
      if (currentUser) {
        // 1. Optimistic UI update
        const nextLiked = !liked;
        setLiked(nextLiked);
        setNumberLike(prev => nextLiked ? prev + 1 : Math.max(0, prev - 1));

        // 2. Debounce API request (delay 500ms)
        if (likeTimeoutRef.current) {
          clearTimeout(likeTimeoutRef.current);
        }

        likeTimeoutRef.current = setTimeout(() => {
          runLikeApi(nextLiked);
          likeTimeoutRef.current = null;
        }, 500);

        animateLike();
      }
    });
  };

  const handleLikeAndShowHeart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    requireAuth(() => {
      if (currentUser) {
        // Nếu chưa liked cục bộ thì mới thực hiện like
        if (!liked) {
          setLiked(true);
          setNumberLike(prev => prev + 1);

          if (likeTimeoutRef.current) {
            clearTimeout(likeTimeoutRef.current);
          }

          likeTimeoutRef.current = setTimeout(() => {
            runLikeApi(true);
            likeTimeoutRef.current = null;
          }, 500);
        }
      }
    });
    showFloatingHeart();
  };

  const handleSavePost = () => {
    requireAuth(() => {
      dispatch(toggleSavePostThunk(post.postId));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });
  };

  const handleShare = () => {
    requireAuth(() => {
      if (!currentUser) return;
      Alert.alert(
        'Chia sẻ bài viết',
        'Bạn muốn chia sẻ bài viết này như thế nào?',
        [
          {
            text: 'Chia sẻ ngay lên trang cá nhân',
            onPress: async () => {
              try {
                const formData = new FormData();
                formData.append('post', JSON.stringify({
                  user: currentUser.userId,
                  content: '',
                  sharedPostId: post.postId,
                  privacyLevel: 'PUBLIC',
                  isPublicPost: true,
                  isPublicComment: true
                }));
                await dispatch(createPostThunk(formData)).unwrap();
                dispatch(getAllPostsThunk({ page: 1, size: 10 })); // Reload feed
                Alert.alert('Thành công', 'Bài viết đã được chia sẻ lên trang cá nhân của bạn!');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Success);
              } catch (err) {
                Alert.alert('Lỗi', 'Không thể chia sẻ bài viết');
              }
            }
          },
          {
            text: 'Viết cảm nghĩ...',
            onPress: () => {
              // Chuyển hướng sang màn hình tạo bài viết và truyền sharedPostId
              router.push({
                pathname: '/create-post',
                params: { sharedPostId: post.postId }
              });
            }
          },
          {
            text: 'Chia sẻ qua ứng dụng khác...',
            onPress: async () => {
              try {
                const result = await Share.share({
                  message: `Xem bài viết này từ ${post.user.username}: ${post.content || ''}`,
                });
                if (result.action === Share.sharedAction) {
                  dispatch(sharePostThunk({ postId: post.postId, userId: currentUser.userId }));
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              } catch (error) {
                Alert.alert('Lỗi', 'Không thể chia sẻ');
              }
            }
          },
          {
            text: 'Hủy',
            style: 'cancel'
          }
        ],
        { cancelable: true }
      );
    });
  };

  const images: PostImage[] = React.useMemo(() => {
    return post.mediaUrls
      ? post.mediaUrls.map((url, idx) => ({ id: `${post.postId}-img-${idx}`, url }))
      : [];
  }, [post.postId, post.mediaUrls]);

  return (
    <View
      className="mb-6 mx-4 rounded-2xl"
      style={{
        backgroundColor: isDark ? '#2A0E4D' : '#FFFFFF',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: 12,
          },
          android: { elevation: 4 },
        }),
      }}
    >
      {/* Header */}
      <PostHeader
        post={post}
        isDark={isDark}
        hasUnviewedStory={hasUnviewedStory}
        hasStory={hasStory}
        showOptions={showOptions}
        setShowOptions={(v) => requireAuth(() => setShowOptions(v))}
      />

      {/* Media */}
      {images.length > 0 && (
        <View style={{ position: 'relative', width: '100%' }}>
          <MultiImageGrid images={images} onLikeDoubleTap={handleLikeAndShowHeart} isActive={isActive} />
          <FloatingHeart visible={showHeart} scale={heartScale} opacity={heartOpacity} />
        </View>
      )}

      {/* Caption + Actions + Comments */}
      <View className="px-4 pb-4">
        {post.content ? (
          <MentionText className="text-sm text-slate-700 dark:text-slate-200 leading-snug mt-4 mb-4">
            {post.content}
          </MentionText>
        ) : (
          <View className="mt-4 mb-4" />
        )}

        {/* Box bài viết gốc được lồng bên trong (Share Post) */}
        {post.sharedPost && (
          <View 
            className="mb-4 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40"
            style={{ overflow: 'hidden' }}
          >
            {/* Header tác giả gốc */}
            <View className="flex-row items-center gap-2 mb-3">
              <Image 
                source={{ uri: getMediaUrl(post.sharedPost.user?.profilePicture) || `https://ui-avatars.com/api/?name=${post.sharedPost.user?.username || 'U'}&background=7c3bed&color=fff` }}
                className="w-7 h-7 rounded-full"
              />
              <View>
                <Text className="text-xs font-bold text-slate-800 dark:text-white">
                  {post.sharedPost.user?.username || 'Người dùng'}
                </Text>
                <Text className="text-[10px] text-slate-500 dark:text-slate-400">
                  {dayjs(post.sharedPost.createdAt).format('DD/MM/YYYY HH:mm')}
                </Text>
              </View>
            </View>

            {/* Nội dung bài viết gốc */}
            {post.sharedPost.content ? (
              <MentionText className="text-xs text-slate-700 dark:text-slate-300 leading-snug mb-3">
                {post.sharedPost.content}
              </MentionText>
            ) : null}

            {/* Media của bài viết gốc */}
            {post.sharedPost.mediaUrls && post.sharedPost.mediaUrls.length > 0 && (
              <View style={{ borderRadius: 12, overflow: 'hidden', marginTop: 4 }}>
                <MultiImageGrid 
                  images={post.sharedPost.mediaUrls.map((url: string) => ({ url }))} 
                  onLikeDoubleTap={() => {}} 
                  isActive={isActive} 
                />
              </View>
            )}
          </View>
        )}

        {/* Tạo post giả lập chứa state like cục bộ để truyền vào Actions */}
        <PostActions
          post={React.useMemo(() => ({ ...post, liked, numberLike }), [post, liked, numberLike])}
          isDark={isDark}
          likeScale={likeScale}
          showComments={showComments}
          onLike={handleLike}
          onToggleComments={() => setShowComments(v => !v)}
          onSave={handleSavePost}
          onShare={handleShare}
        />

        {showComments && (
          <CommentSection
            postId={post.postId}
            currentUserId={currentUser?.userId}
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuth}
          />
        )}
      </View>
    </View>
  );
}
