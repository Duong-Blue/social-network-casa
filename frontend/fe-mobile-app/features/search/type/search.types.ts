import { PostResponse } from '@/features/post/type/post.types';

export interface SearchUser {
  userId: string;
  username: string;
  profilePicture: string | null;
}

export interface SearchResult {
  users: SearchUser[];
  posts: PostResponse[];
  totalUsers: number;
  totalPosts: number;
}

export interface SearchState {
  query: string;
  results: SearchResult | null;
  isLoading: boolean;
  error: string | null;
}

export type SearchType = 'all' | 'users' | 'posts';
