import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import MentionText from '@/components/MentionText';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface Reply {
  commentId: string;
  content: string;
  isLiked?: boolean;
  createdAt: string;
  user: { username: string; profilePicture?: string };
}

interface ReplyListProps {
  replies: Reply[];
  rootCommentId: string;
  expandedReplies: Set<string>;
  visibleRepliesCount: Record<string, number>;
  colorScheme: string | undefined;
  REPLIES_PER_PAGE: number;
  onToggle: (commentId: string) => void;
  onShowMore: (commentId: string, total: number) => void;
  onLike: (commentId: string) => void;
  onReply: (rootCommentId: string, username: string) => void;
}

export function ReplyList({
  replies,
  rootCommentId,
  expandedReplies,
  visibleRepliesCount,
  colorScheme,
  REPLIES_PER_PAGE,
  onToggle,
  onShowMore,
  onLike,
  onReply,
}: ReplyListProps) {
  if (!expandedReplies.has(rootCommentId)) return null;

  const visible = visibleRepliesCount[rootCommentId] || REPLIES_PER_PAGE;
  const shownReplies = replies.slice(0, visible);
  const remaining = replies.length - visible;
  const lineColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';

  if (replies.length === 0) return null;

  return (
    <View style={{ marginLeft: 44, marginTop: 4, position: 'relative' }}>
      {/* Vertical nesting line */}
      <View
        style={{
          position: 'absolute', left: -24, top: -10, bottom: 20,
          width: 1.5, backgroundColor: lineColor, borderRadius: 1,
        }}
      />

      {/* Nút Ẩn câu trả lời — trên cùng */}
      <TouchableOpacity onPress={() => onToggle(rootCommentId)} className="mb-2">
        <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
          Ẩn câu trả lời
        </Text>
      </TouchableOpacity>

      {/* Danh sách replies hiện tại */}
      <View style={{ gap: 12 }}>
        {shownReplies.map((reply) => {
          const avatarUri = reply.user.profilePicture
            ? getMediaUrl(reply.user.profilePicture)
            : `https://ui-avatars.com/api/?name=${reply.user.username}&background=random`;

          return (
            <View key={reply.commentId} className="flex-row gap-2 relative mb-2">
              {/* Horizontal connector line */}
              <View
                style={{
                  position: 'absolute', left: -24, top: 12,
                  width: 16, height: 1.5, backgroundColor: lineColor,
                }}
              />
              <View className="w-6 h-6 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                <Image source={{ uri: avatarUri }} style={{ width: 24, height: 24 }} resizeMode="cover" />
              </View>
              <View className="flex-1">
                <View className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl px-3 py-1.5 border border-slate-200 dark:border-white/5">
                  <View className="flex-row justify-between items-center mb-0.5">
                    <Text className="text-[11px] font-bold text-slate-800 dark:text-white">{reply.user.username}</Text>
                    <Text className="text-[9px] text-slate-400 dark:text-slate-500">{dayjs(reply.createdAt).fromNow()}</Text>
                  </View>
                  <MentionText className="text-xs text-slate-700 dark:text-slate-200">{reply.content}</MentionText>
                </View>
                <View className="flex-row items-center gap-3 mt-1 px-1">
                  <TouchableOpacity onPress={() => onLike(reply.commentId)}>
                    <MaterialIcons
                      name={reply.isLiked ? 'favorite' : 'favorite-border'}
                      size={12}
                      color={reply.isLiked ? '#F43F5E' : '#94A3B8'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onReply(rootCommentId, reply.user.username)}>
                    <Text className="text-[9px] font-bold text-slate-500 dark:text-slate-400">Trả lời</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Nút Xem thêm — dưới cùng */}
      {remaining > 0 && (
        <TouchableOpacity onPress={() => onShowMore(rootCommentId, replies.length)} className="mt-2">
          <Text className="text-[10px] text-primary font-medium">
            Xem thêm {remaining} câu trả lời
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
