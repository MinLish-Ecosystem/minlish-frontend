import api from '../lib/api';
import { ApiResponse } from '../types/api';
import { Post, Comment, CreatePostPayload, PostFilters } from '../types/post';

export const getPosts = (filters: PostFilters) => {
  return api.get<ApiResponse<Post[]>>('/api/v1/posts', {
    params: filters,
  });
};

export const createPost = (payload: CreatePostPayload) => {
  return api.post<ApiResponse<Post>>('/api/v1/posts', payload);
};

export const toggleLike = (postId: string) => {
  return api.post<ApiResponse<{ isLiked: boolean; likeCount: number }>>(`/api/v1/posts/${postId}/like`);
};

export const toggleBookmark = (postId: string) => {
  return api.post<ApiResponse<{ isBookmarked: boolean }>>(`/api/v1/posts/${postId}/bookmark`);
};

export const getComments = (postId: string) => {
  return api.get<ApiResponse<Comment[]>>(`/api/v1/posts/${postId}/comments`);
};

export const getPostDetail = (postId: string) => {
  return api.get<ApiResponse<Post>>(`/api/v1/posts/${postId}`);
};

export const addComment = (postId: string, content: string, parentComment?: string) => {
  return api.post<ApiResponse<Comment>>(`/api/v1/posts/${postId}/comments`, { content, parentComment });
};

export const toggleLikeComment = (commentId: string) => {
  return api.post<ApiResponse<{ isLiked: boolean; likeCount: number }>>(`/api/v1/posts/comments/${commentId}/like`);
};

export const updatePost = (postId: string, payload: Partial<CreatePostPayload>) => {
  return api.put<ApiResponse<Post>>(`/api/v1/posts/${postId}`, payload);
};

export const deletePost = (postId: string) => {
  return api.delete<ApiResponse<void>>(`/api/v1/posts/${postId}`);
};

