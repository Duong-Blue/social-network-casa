import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserStoryGroup, StoryState, StoryResponse } from '../type/story.types';
import { 
  getFriendStoriesPending, 
  getFriendStoriesFulfilled, 
  getFriendStoriesRejected,
  createStoryFulfilled,
  deleteStoryFulfilled,
  reactStoryFulfilled
} from '../thunk/story.thunk';
import { BackendResponse } from '@/utils/helpers/api_helper';

const initialState: StoryState = {
  stories: [],
  isLoading: false,
  error: null,
};

export const storySlice = createSlice({
  name: 'story',
  initialState,
  reducers: {
    clearStoryError: (state) => {
      state.error = null;
    },
    resetStoryState: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Get Friend Stories
    builder
      .addCase(getFriendStoriesPending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getFriendStoriesFulfilled, (state, action: PayloadAction<BackendResponse<UserStoryGroup[]>>) => {
        state.isLoading = false;
        state.stories = action.payload.data;
        state.error = null;
      })
      .addCase(getFriendStoriesRejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Failed to fetch stories';
      })
      // Create Story
      .addCase(createStoryFulfilled, (state, action: PayloadAction<BackendResponse<StoryResponse>>) => {
        const newStory = action.payload.data;
        const existingGroupIndex = state.stories.findIndex(group => group.userId === newStory.userId);

        if (existingGroupIndex !== -1) {
          // Thêm story mới vào nhóm hiện có
          state.stories[existingGroupIndex].stories.unshift(newStory);
        } else {
          // Tạo nhóm mới và đưa lên đầu
          state.stories.unshift({
            userId: newStory.userId,
            stories: [newStory]
          });
        }
      })
      // Delete Story
      .addCase(deleteStoryFulfilled, (state, action: PayloadAction<{ storyId: string; userId: string }>) => {
        const { storyId, userId } = action.payload;
        const groupIndex = state.stories.findIndex(group => group.userId === userId);
        if (groupIndex !== -1) {
          state.stories[groupIndex].stories = state.stories[groupIndex].stories.filter(s => s._id !== storyId);
          if (state.stories[groupIndex].stories.length === 0) {
            state.stories.splice(groupIndex, 1);
          }
        }
      })
      // React Story
      .addCase(reactStoryFulfilled, (state, action: PayloadAction<StoryResponse>) => {
        const updatedStory = action.payload;
        const groupIndex = state.stories.findIndex(group => group.userId === updatedStory.userId);
        if (groupIndex !== -1) {
          const storyIndex = state.stories[groupIndex].stories.findIndex(s => s._id === updatedStory._id);
          if (storyIndex !== -1) {
            state.stories[groupIndex].stories[storyIndex] = updatedStory;
          }
        }
      });
  },
});

export const { clearStoryError, resetStoryState } = storySlice.actions;
export default storySlice.reducer;
