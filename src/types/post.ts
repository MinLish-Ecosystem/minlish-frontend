export interface PostAuthor {
  _id: string;
  name: string;
  avatar: string | null;
  email: string;
}

export interface Post {
  _id: string;
  title: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  readingTime: number;
  author: PostAuthor;
  likes: string[];
  bookmarks: string[];
  isFeatured: boolean;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  author: PostAuthor;
  post: string;
  parentComment?: string | null;
  likes?: string[];
  likeCount?: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostPayload {
  title: string;
  content: string;
  category: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  coverImage?: string;
  isFeatured?: boolean;
}

export interface PostFilters {
  q?: string;
  category?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  readingTime?: 'short' | 'medium' | 'long';
  sortBy?: 'latest' | 'popular' | 'trending' | 'discussed';
  author?: string;
  bookmarked?: string;
  page?: number;
  limit?: number;
}
