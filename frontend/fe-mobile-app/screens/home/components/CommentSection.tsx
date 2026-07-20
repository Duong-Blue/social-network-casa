import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { createCommentThunk, getCommentsByPostThunk, getCommentRepliesThunk, createCommentFulfilled } from '@/features/comment/thunk/comment.thunk';
import { likeCommentThunk } from '@/features/interaction/thunk/interaction.thunk';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import { ReplyList } from './ReplyList';
import MentionText from '@/components/MentionText';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useColorScheme } from 'nativewind';

dayjs.extend(relativeTime);

const COMMENTS_PER_PAGE = 3;
const REPLIES_PER_PAGE = 3;

interface CommentSectionProps {
  postId: string | number;
  currentUserId?: string;
  isAuthenticated: boolean;
  onRequireAuth: (action: () => void) => void;
}

export function CommentSection({ postId, currentUserId, isAuthenticated, onRequireAuth }: CommentSectionProps) {
  const dispatch = useAppDispatch();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const allComments = useAppSelector(state => state.comment.commentsByPost[String(postId)]);
  const { error: commentError, isSubmitting } = useAppSelector(state => state.comment);

  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ commentId: string; username: string } | null>(null);

  // Phân trang comment gốc
  const [visibleComments, setVisibleComments] = useState(COMMENTS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Replies state
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [visibleRepliesCount, setVisibleRepliesCount] = useState<Record<string, number>>({});
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());

  const allCommentsList = useMemo(() => allComments || [], [allComments]);

  // Chỉ lấy root comments (không có parentCommentId)
  const rootComments = useMemo(() => allCommentsList.filter((c: any) => !c.parentCommentId), [allCommentsList]);
  const shownRootComments = useMemo(() => rootComments.slice(0, visibleComments), [rootComments, visibleComments]);
  const remainingComments = rootComments.length - visibleComments;

  // Fetch comments khi component mount
  useEffect(() => {
    if (postId) {
      dispatch(getCommentsByPostThunk({ postId: String(postId), page: 1, size: 10 }));
      setLoadedPages(new Set([1]));
    }
  }, [postId, dispatch]);

  // Map replies theo root commentId để tránh filter trong map
  const repliesByRoot = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const c of allCommentsList) {
      if (c.parentCommentId) {
        const key = String(c.parentCommentId);
        if (!map[key]) map[key] = [];
        map[key].push(c);
      }
    }
    return map;
  }, [allCommentsList]);

  const handleShowMoreComments = async () => {
    setIsLoadingMore(true);
    const nextPage = loadedPages.size + 1;
    if (!loadedPages.has(nextPage)) {
      await dispatch(getCommentsByPostThunk({ postId: String(postId), page: nextPage, size: 10 }));
      setLoadedPages(prev => new Set(prev).add(nextPage));
    }
    setVisibleComments(prev => prev + COMMENTS_PER_PAGE);
    setIsLoadingMore(false);
  };

  const handleCollapseComments = () => {
    setVisibleComments(COMMENTS_PER_PAGE);
  };

  const handleToggleReplies = (commentId: string) => {
    const isExpanded = expandedReplies.has(commentId);
    if (isExpanded) {
      setExpandedReplies(prev => { const s = new Set(prev); s.delete(commentId); return s; });
      setVisibleRepliesCount(prev => { const r = { ...prev }; delete r[commentId]; return r; });
    } else {
      dispatch(getCommentRepliesThunk({ commentId, postId: String(postId), page: 1, size: 50 }));
      setExpandedReplies(prev => new Set(prev).add(commentId));
      setVisibleRepliesCount(prev => ({ ...prev, [commentId]: REPLIES_PER_PAGE }));
    }
  };

  const handleShowMoreReplies = (commentId: string, total: number) => {
    setVisibleRepliesCount(prev => ({
      ...prev,
      [commentId]: Math.min((prev[commentId] || REPLIES_PER_PAGE) + REPLIES_PER_PAGE, total),
    }));
  };

  const handleLikeComment = (commentId: string) => {
    onRequireAuth(() => {
      if (currentUserId) {
        dispatch(likeCommentThunk({ commentId, userId: currentUserId }));
      }
    });
  };

  const handleSetReply = (commentId: string, username: string) => {
    setReplyTo({ commentId, username });
    setNewComment(`@${username} `);
  };

  const handleAddComment = () => {
    onRequireAuth(() => {
      if (currentUserId && newComment.trim() && !isSubmitting) {
        const commentData: any = {
          postId,
          userId: currentUserId,
          content: newComment.trim(),
        };
        if (replyTo?.commentId) {
          commentData.parentCommentId = replyTo.commentId;
        }
        dispatch(createCommentThunk(commentData))
          .then((result: any) => {
            if (createCommentFulfilled.match(result)) {
              setNewComment('');
              setReplyTo(null);
            }
          })
          .catch(() => { });
      }
    });
  };

  return (
    <View className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5" style={{ minHeight: 100 }}>

      {/* ── Comment List ── */}
      <View className="gap-4 mb-4">

        {/* Nút Thu gọn — trên cùng (chỉ hiện khi đang xem nhiều hơn mặc định) */}
        {visibleComments > COMMENTS_PER_PAGE && (
          <TouchableOpacity onPress={handleCollapseComments} className="items-center py-1">
            <Text className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              ▲ Thu gọn bình luận
            </Text>
          </TouchableOpacity>
        )}

        {shownRootComments.map((rootComment: any) => {
          const avatarUri = rootComment.user.profilePicture
            ? getMediaUrl(rootComment.user.profilePicture)
            : `https://ui-avatars.com/api/?name=${rootComment.user.username}&background=random`;

          const replies = repliesByRoot[String(rootComment.commentId)] || [];

          return (
            <View key={rootComment.commentId}>
              {/* Root Comment */}
              <View className="flex-row gap-3">
                <View className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <Image source={{ uri: avatarUri }} style={{ width: 32, height: 32 }} resizeMode="cover" />
                </View>
                <View className="flex-1">
                  <View className="bg-slate-100 dark:bg-white/5 rounded-2xl px-3 py-2">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-xs font-bold text-slate-800 dark:text-white">{rootComment.user.username}</Text>
                      <Text className="text-[10px] text-slate-400 dark:text-slate-500">{dayjs(rootComment.createdAt).fromNow()}</Text>
                    </View>
                    <MentionText className="text-sm text-slate-700 dark:text-slate-200">{rootComment.content}</MentionText>
                  </View>

                  {/* Root Comment Actions */}
                  <View className="flex-row items-center gap-4 mt-1 px-2">
                    <TouchableOpacity
                      onPress={() => handleLikeComment(rootComment.commentId)}
                      className="flex-row items-center gap-1"
                    >
                      <MaterialIcons
                        name={rootComment.isLiked ? 'favorite' : 'favorite-border'}
                        size={14}
                        color={rootComment.isLiked ? '#F43F5E' : '#94A3B8'}
                      />
                      {rootComment.numberLikeComment > 0 && (
                        <Text className={`text-[10px] ${rootComment.isLiked ? 'text-[#F43F5E]' : 'text-slate-400 dark:text-slate-500'}`}>
                          {rootComment.numberLikeComment}
                        </Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleSetReply(rootComment.commentId, rootComment.user.username)}>
                      <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Trả lời</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Toggle Replies Button */}
                  {rootComment.numberReplyComment > 0 && (
                    <TouchableOpacity
                      onPress={() => handleToggleReplies(rootComment.commentId)}
                      className="mt-1 px-2"
                    >
                      <Text className="text-[10px] text-primary font-medium">
                        {expandedReplies.has(rootComment.commentId)
                          ? '--- Ẩn câu trả lời'
                          : `--- Xem ${rootComment.numberReplyComment} câu trả lời`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Reply List */}
              <ReplyList
                replies={replies}
                rootCommentId={rootComment.commentId}
                expandedReplies={expandedReplies}
                visibleRepliesCount={visibleRepliesCount}
                colorScheme={colorScheme}
                REPLIES_PER_PAGE={REPLIES_PER_PAGE}
                onToggle={handleToggleReplies}
                onShowMore={handleShowMoreReplies}
                onLike={handleLikeComment}
                onReply={handleSetReply}
              />
            </View>
          );
        })}

        {/* Empty state */}
        {rootComments.length === 0 && (
          <View className="py-4 items-center">
            <Text className="text-xs text-slate-400 dark:text-slate-500">
              Chưa có bình luận nào. Hãy là người đầu tiên!
            </Text>
          </View>
        )}

        {/* Nút Xem thêm bình luận — dưới cùng */}
        {remainingComments > 0 && (
          <TouchableOpacity
            onPress={handleShowMoreComments}
            disabled={isLoadingMore}
            className="items-center py-2"
          >
            {isLoadingMore ? (
              <ActivityIndicator size="small" color="#8B5CF6" />
            ) : (
              <Text className="text-[11px] text-primary font-semibold">
                ▼ Xem thêm {remainingComments} bình luận
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ── Comment Input ── */}
      <View>
        {/* Reply Indicator */}
        {replyTo && (
          <View className="flex-row items-center justify-between mb-2 px-4 py-1 bg-primary/10 rounded-lg">
            <Text className="text-[10px] text-primary">Đang trả lời @{replyTo.username}</Text>
            <TouchableOpacity onPress={() => { setReplyTo(null); setNewComment(''); }}>
              <MaterialIcons name="close" size={14} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
        )}

        {/* Error */}
        {commentError && (
          <Text className="text-[10px] text-red-500 mb-2 px-4 italic">{commentError}</Text>
        )}

        <View className="flex-row items-center gap-2">
          <View className="flex-1 bg-slate-100 dark:bg-white/5 rounded-full px-4 py-1 border border-slate-200 dark:border-white/10">
            <TextInput
              placeholder="Thêm bình luận..."
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              className="text-slate-800 dark:text-white text-sm py-1"
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            onPress={handleAddComment}
            disabled={!newComment.trim()}
            className={`p-2 rounded-full ${newComment.trim() ? 'bg-primary' : 'bg-slate-700 opacity-50'}`}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialIcons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
