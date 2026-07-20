import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SearchState, SearchResult } from '@/features/search/type/search.types';
import { searchThunk } from '@/features/search/thunk/search.thunk';

const initialState: SearchState = {
  query: '',
  results: null,
  isLoading: false,
  error: null,
};

export const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    clearSearch: (state) => {
      state.query = '';
      state.results = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchThunk.fulfilled, (state, action: PayloadAction<{ success?: boolean; data: SearchResult }>) => {
        state.isLoading = false;
        state.results = action.payload.data;
        state.error = null;
      })
      .addCase(searchThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Search failed';
      });
  },
});

export const { setQuery, clearSearch } = searchSlice.actions;
export default searchSlice.reducer;
