import { createAsyncThunk } from '@reduxjs/toolkit';
import { searchService } from '@/features/search/service/search.service';
import { SearchType } from '@/features/search/type/search.types';

export const searchThunk = createAsyncThunk(
  'search/search',
  async (
    params: { query: string; type?: SearchType; page?: number; size?: number },
    { rejectWithValue },
  ) => {
    try {
      const { query, type = 'all', page = 1, size = 20 } = params;
      if (!query.trim()) {
        return { data: { users: [], posts: [], totalUsers: 0, totalPosts: 0 } };
      }
      const response = await searchService.search(query.trim(), type, page, size);
      if (!response.success) {
        return rejectWithValue(response.message || 'Search failed');
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);
