import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  getAllPostsThunk, 
  getAllPostsPending, 
  getAllPostsFulfilled, 
  getAllPostsRejected, 
  getAllPostsByUserIdPending, 
  getAllPostsByUserIdFulfilled, 
  getAllPostsByUserIdRejected, 
  createPostThunk, 
  createPostFulfilled, 
  deletePostFulfilled,
  toggleSavePostFulfilled,
  getSavedPostsPending,
  getSavedPostsFulfilled,
  getSavedPostsRejected,
  getSharedPostsPending,
  getSharedPostsFulfilled,
  getSharedPostsRejected,
  deleteShareFulfilled,
  getPostByIdPending,
  getPostByIdFulfilled,
  getPostByIdRejected,
  sharePostFulfilled
} from '../thunk/post.thunk';
import { likePostFulfilled } from '../../interaction/thunk/interaction.thunk';
import { createCommentFulfilled } from '../../comment/thunk/comment.thunk';
import { PostResponse, PostState } from '../type/post.types';
import { BackendResponse } from '@/utils/helpers/api_helper';
import { Page } from '@/utils/types/common.types';

const initialState: PostState = {
  posts: [],
  userPosts: [],
  savedPosts: [],
  sharedPosts: [],
  currentPost: null,
  isLoading: false,
  error: null,
  totalPages: 0,
  currentPage: 0,
};

export const postSlice = createSlice({
  name: 'post',
  initialState,
  reducers: {
    clearPostError: (state) => {
      state.error = null;
    },
    resetPostState: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Get All Posts
    builder
      .addCase(getAllPostsPending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllPostsFulfilled, (state, action) => {
        state.isLoading = false;
        const page = action.meta.arg.page || 1;
        const newPosts = action.payload.data.content;
        
        if (page === 1) {
            state.posts = newPosts;
        } else {
            const existingIds = new Set(state.posts.map(p => p.postId));
            const uniqueNewPosts = newPosts.filter((p: any) => !existingIds.has(p.postId));
            state.posts = [...state.posts, ...uniqueNewPosts];
        }
        
        state.totalPages = action.payload.data.totalPages;
        state.currentPage = action.payload.data.number;
        state.error = null;
      })
      .addCase(getAllPostsRejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Failed to fetch posts';
      })
      // Get All Posts By User Id
      .addCase(getAllPostsByUserIdPending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllPostsByUserIdFulfilled, (state, action) => {
        state.isLoading = false;
        const page = action.meta.arg.page || 1;
        const newPosts = action.payload.data.content;
        
        if (page === 1) {
            state.userPosts = newPosts;
        } else {
            const existingIds = new Set(state.userPosts.map(p => p.postId));
            const uniqueNewPosts = newPosts.filter((p: any) => !existingIds.has(p.postId));
            state.userPosts = [...state.userPosts, ...uniqueNewPosts];
        }
        
        state.totalPages = action.payload.data.totalPages;
        state.currentPage = action.payload.data.number;
        state.error = null;
      })
      .addCase(getAllPostsByUserIdRejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Failed to fetch user posts';
      })
      // Create Post
      .addCase(createPostFulfilled, (state, action: PayloadAction<BackendResponse<PostResponse>>) => {
        state.posts = [action.payload.data, ...state.posts];
        state.userPosts = [action.payload.data, ...state.userPosts];
      })
      // Like Post
      .addCase(likePostFulfilled, (state, action) => {
        const { postId } = action.meta.arg;
        const updateLike = (list: PostResponse[]) => {
          const post = list.find(p => p.postId === postId);
          if (post) {
            post.liked = !post.liked;
            post.numberLike = post.liked ? (post.numberLike || 0) + 1 : Math.max(0, (post.numberLike || 0) - 1);
          }
        };
        updateLike(state.posts);
        updateLike(state.userPosts);
      })
      // Create Comment (Update count)
      .addCase(createCommentFulfilled, (state, action) => {
        const postId = String(action.meta.arg.postId);
        const updateCommentCount = (list: PostResponse[]) => {
          const post = list.find(p => String(p.postId) === postId);
          if (post) {
            post.numberComment = (post.numberComment || 0) + 1;
          }
        };
        updateCommentCount(state.posts);
        updateCommentCount(state.userPosts);
      })
      // Share Post
      .addCase(sharePostFulfilled, (state, action) => {
        const { postId } = action.meta.arg;
        const updateShare = (list: PostResponse[]) => {
          const post = list.find(p => p.postId === postId);
          if (post) {
            post.numberShare = (post.numberShare || 0) + 1;
          }
        };
        updateShare(state.posts);
        updateShare(state.userPosts);
        updateShare(state.savedPosts);
      })
      // Delete Post
      .addCase(deletePostFulfilled, (state, action) => {
        const postId = action.meta.arg;
        state.posts = state.posts.filter(p => p.postId !== postId);
        state.userPosts = state.userPosts.filter(p => p.postId !== postId);
        state.savedPosts = state.savedPosts.filter(p => p.postId !== postId);
        state.sharedPosts = state.sharedPosts.filter(p => p.postId !== postId);
      })
      // Delete Share
      .addCase(deleteShareFulfilled, (state, action) => {
        const shareId = action.meta.arg;
        state.sharedPosts = state.sharedPosts.filter(p => p.shareId !== shareId);
      })
      // Toggle Save Post
      .addCase(toggleSavePostFulfilled, (state, action) => {
        const postId = action.meta.arg;
        const isSaved = action.payload.data; // true = đã lưu, false = đã hủy lưu
        
        const updateSaveStatus = (list: PostResponse[]) => {
          const post = list.find(p => p.postId === postId);
          if (post) {
            post.isSaved = isSaved;
          }
        };
        
        updateSaveStatus(state.posts);
        updateSaveStatus(state.userPosts);
        
        // Cập nhật danh sách bài viết đã lưu (savedPosts)
        if (isSaved) {
          // Tìm bài đăng từ posts hoặc userPosts
          const postToSave = state.posts.find(p => p.postId === postId) || state.userPosts.find(p => p.postId === postId);
          if (postToSave) {
            const alreadySaved = state.savedPosts.some(p => p.postId === postId);
            if (!alreadySaved) {
              state.savedPosts = [{ ...postToSave, isSaved: true }, ...state.savedPosts];
            }
          }
        } else {
          // Hủy lưu: Xóa khỏi danh sách savedPosts
          state.savedPosts = state.savedPosts.filter(p => p.postId !== postId);
        }
      })
      // Get Saved Posts
      .addCase(getSavedPostsPending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSavedPostsFulfilled, (state, action) => {
        state.isLoading = false;
        const page = action.meta.arg.page || 1;
        const newPosts = action.payload.data.content;
        
        if (page === 1) {
            state.savedPosts = newPosts;
        } else {
            const existingIds = new Set(state.savedPosts.map(p => p.postId));
            const uniqueNewPosts = newPosts.filter((p: any) => !existingIds.has(p.postId));
            state.savedPosts = [...state.savedPosts, ...uniqueNewPosts];
        }
        
        state.totalPages = action.payload.data.totalPages;
        state.currentPage = action.payload.data.number;
        state.error = null;
      })
      .addCase(getSavedPostsRejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Failed to fetch saved posts';
      })
      // Get Shared Posts
      .addCase(getSharedPostsPending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSharedPostsFulfilled, (state, action) => {
        state.isLoading = false;
        const page = action.meta.arg.page || 1;
        const newPosts = action.payload.data.content;
        
        if (page === 1) {
            state.sharedPosts = newPosts;
        } else {
            const existingIds = new Set(state.sharedPosts.map(p => p.postId));
            const uniqueNewPosts = newPosts.filter((p: any) => !existingIds.has(p.postId));
            state.sharedPosts = [...state.sharedPosts, ...uniqueNewPosts];
        }
        
        state.totalPages = action.payload.data.totalPages;
        state.currentPage = action.payload.data.number;
        state.error = null;
      })
      .addCase(getSharedPostsRejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Failed to fetch shared posts';
      })
      // Get Post By Id
      .addCase(getPostByIdPending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.currentPost = null;
      })
      .addCase(getPostByIdFulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPost = action.payload.data;
        state.error = null;
      })
      .addCase(getPostByIdRejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Failed to fetch post details';
      });
  },
});

export const { clearPostError, resetPostState } = postSlice.actions;
export default postSlice.reducer;
