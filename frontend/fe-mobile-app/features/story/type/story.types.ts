export interface StoryReaction {
  userId: string;
  emoji: string;
}

export interface StoryResponse {
  _id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  viewers: string[];
  reactions: StoryReaction[];
  createdAt: string;
  updatedAt: string;
}

export interface UserStoryGroup {
  userId: string;
  stories: StoryResponse[];
}

export interface StoryState {
  stories: UserStoryGroup[];
  isLoading: boolean;
  error: string | null;
}

export interface CreateStoryRequest {
  userId: string;
  mediaType: 'image' | 'video';
  file: File | any;
}
