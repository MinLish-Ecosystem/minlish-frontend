import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MessageSquare,
  ThumbsUp,
  Bookmark,
  Plus,
  Search,
  X,
  Sparkles,
  BookOpen,
  ChevronDown,
  User
} from "lucide-react";
import { getPosts, toggleLike, toggleBookmark } from "../../api/post.api";
import { Post } from "../../types/post";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";

const CATEGORIES = [
  "All Topics",
  "IELTS Prep",
  "Business English",
  "Grammar",
  "Speaking",
  "Vocabulary",
  "Cultural Tips"
];

const READING_TIMES = [
  { value: "", label: "Reading Time" },
  { value: "short", label: "< 5 mins" },
  { value: "medium", label: "5-10 mins" },
  { value: "long", label: "10+ mins" }
];

const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "popular", label: "Most Popular" },
  { value: "trending", label: "Trending" },
  { value: "discussed", label: "Most Discussed" }
];

export default function Community() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Topics");
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced" | "">("");
  const [readingTime, setReadingTime] = useState<"short" | "medium" | "long" | "">("");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "trending" | "discussed">("trending");
  const [feedType, setFeedType] = useState<"all" | "mine" | "saved">("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Sync search input with URL search params if present (e.g., clicking hashtags)
  useEffect(() => {
    const qParam = searchParams.get("q");
    if (qParam) {
      setSearch(qParam);
    }
  }, [searchParams]);

  // Load posts helper
  const fetchPostsList = async () => {
    try {
      setLoading(true);
      const res = await getPosts({
        q: search || undefined,
        category: category === "All Topics" ? undefined : category,
        difficulty: difficulty || undefined,
        readingTime: readingTime || undefined,
        sortBy,
        author: feedType === "mine" ? user?.id : undefined,
        bookmarked: feedType === "saved" ? "true" : undefined,
        page,
        limit: 12
      });
      if (res.data?.success) {
        setPosts(res.data.data || []);
        setTotalPages(res.data.meta?.totalPages || 1);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load community posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostsList();
  }, [category, difficulty, readingTime, sortBy, page, feedType]);

  // Handle Enter key for search
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setPage(1);
      fetchPostsList();
    }
  };

  // Toggle Like API
  const handleLike = async (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      // Optimistic update
      setPosts(prev =>
        prev.map(p => {
          if (p._id === postId) {
            const isLikedNow = !p.isLiked;
            return {
              ...p,
              isLiked: isLikedNow,
              likeCount: isLikedNow ? p.likeCount + 1 : Math.max(0, p.likeCount - 1)
            };
          }
          return p;
        })
      );

      await toggleLike(postId);
    } catch (err: any) {
      toast.error("Failed to toggle like status");
      fetchPostsList();
    }
  };

  // Toggle Bookmark API
  const handleBookmark = async (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setPosts(prev =>
        prev.map(p => {
          if (p._id === postId) {
            return { ...p, isBookmarked: !p.isBookmarked };
          }
          return p;
        })
      );

      await toggleBookmark(postId);
      toast.success("Bookmark updated");
    } catch (err: any) {
      toast.error("Failed to update bookmark");
      fetchPostsList();
    }
  };

  // Format date helper (similar to "2 hours ago")
  const formatAge = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return diffMins <= 1 ? "Just now" : `${diffMins} mins ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  // Segregate Featured vs Regular posts
  const featuredPost = posts.find(p => p.isFeatured) || posts[0];
  const regularPosts = posts.filter(p => p._id !== featuredPost?._id);

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-slate-800 tracking-tight">Community Explorations</h2>
          <p className="text-slate-500 mt-1">Discover, read, and share insights with learners worldwide.</p>
        </div>
        <button
          onClick={() => navigate("/community/new")}
          className="flex items-center gap-2 bg-[#9c48ea] text-white px-5 py-2.5 rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 self-start md:self-auto"
        >
          <Plus className="w-5 h-5" />
          Create Post
        </button>
      </div>

      {/* Category Chips & Filters Bar */}
      <div className="flex flex-col gap-6">
        {/* Category Chips & My Posts Toggle container */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none gap-3 flex-1">
            {CATEGORIES.map(cat => {
              const isActive = category === cat && feedType === "all";
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setFeedType("all");
                    setPage(1);
                  }}
                  className={`whitespace-nowrap px-5 py-2 rounded-full font-bold text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-[#4648d4] text-white shadow-md"
                      : "border border-slate-200 bg-white text-slate-500 hover:border-purple-300 hover:text-purple-600"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {user && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-full border border-slate-200/60">
              <button
                onClick={() => {
                  setFeedType("all");
                  setCategory("All Topics");
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                  feedType === "all"
                    ? "bg-[#4648d4] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setFeedType("mine");
                  setCategory("All Topics");
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                  feedType === "mine"
                    ? "bg-[#4648d4] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                My Posts
              </button>
              <button
                onClick={() => {
                  setFeedType("saved");
                  setCategory("All Topics");
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                  feedType === "saved"
                    ? "bg-[#4648d4] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Saved
              </button>
            </div>
          )}
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            {/* Search Input Box */}
            <div className="relative flex-1 md:flex-initial md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Press Enter to search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                    setTimeout(() => fetchPostsList(), 0);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Reading Time filter */}
            <div className="relative">
              <select
                value={readingTime}
                onChange={e => {
                  setReadingTime(e.target.value as any);
                  setPage(1);
                }}
                className="appearance-none pl-4 pr-10 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer transition-all outline-none"
              >
                {READING_TIMES.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Difficulty Level chips/buttons */}
            <div className="flex items-center gap-1.5 border border-slate-100 p-1 rounded-xl bg-slate-50">
              {["", "Beginner", "Intermediate", "Advanced"].map(lvl => {
                const label = lvl || "Any Level";
                const isActive = difficulty === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => {
                      setDifficulty(lvl as any);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[#4648d4] text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <span className="font-semibold text-slate-500 text-sm flex items-center gap-1">
              Sort:
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => {
                  setSortBy(e.target.value as any);
                  setPage(1);
                }}
                className="appearance-none pl-4 pr-10 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer transition-all outline-none"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Posts */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 h-64 border-dashed border-2 border-slate-200 flex flex-col justify-between animate-pulse"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                  <div className="h-3 w-24 bg-slate-200 rounded"></div>
                </div>
                <div className="h-4 w-16 bg-slate-100 rounded"></div>
                <div className="h-6 w-3/4 bg-slate-200 rounded"></div>
                <div className="h-6 w-1/2 bg-slate-200 rounded"></div>
              </div>
              <div className="h-4 w-full bg-slate-100 rounded mt-auto"></div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-700 text-lg">No posts found</h3>
          <p className="text-slate-400 text-sm max-w-sm mt-1">
            Try adjusting your search filters or create the very first post of this category!
          </p>
          <button
            onClick={() => navigate("/community/new")}
            className="mt-4 px-4 py-2 bg-[#9c48ea] text-white rounded-full text-sm font-bold hover:bg-purple-600 transition-colors"
          >
            Create a Post
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Featured Post Card (spans 2 columns on medium+) */}
            {featuredPost && (
              <article
                onClick={() => navigate(`/community/post/${featuredPost._id}`)}
                className="bg-white rounded-3xl overflow-hidden flex flex-col md:col-span-2 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group animate-fade-in"
              >
                <div className="h-60 w-full relative bg-slate-100 overflow-hidden">
                  {featuredPost.coverImage ? (
                    <img
                      src={featuredPost.coverImage}
                      alt="Cover image"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#6063ee] to-[#9c48ea] opacity-85 flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-white/50 animate-pulse" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/95 backdrop-blur text-purple-700 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      Featured Insight
                    </span>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-3 mb-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-medium">
                      {featuredPost.author.avatar ? (
                        <img
                          src={featuredPost.author.avatar}
                          alt={featuredPost.author.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-bold border">
                          {featuredPost.author.name[0]}
                        </div>
                      )}
                      <span>{featuredPost.author.name}</span>
                    </div>
                    <span>•</span>
                    <span>{formatAge(featuredPost.createdAt)}</span>
                    <span>•</span>
                    <span className="bg-slate-100 px-2.5 py-0.5 rounded-full text-slate-600 font-bold">
                      {featuredPost.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-purple-600 transition-colors">
                    {featuredPost.title}
                  </h3>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-6 flex-grow">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                    <div className="flex gap-4">
                      <button
                        onClick={e => handleLike(featuredPost._id, e)}
                        className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${
                          featuredPost.isLiked ? "text-purple-600" : "text-slate-400 hover:text-purple-600"
                        }`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${featuredPost.isLiked ? "fill-purple-600" : ""}`} />
                        {featuredPost.likeCount}
                      </button>
                      <button className="flex items-center gap-1.5 text-slate-400 hover:text-purple-600 text-sm font-bold transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        {featuredPost.commentCount}
                      </button>
                    </div>
                    <button
                      onClick={e => handleBookmark(featuredPost._id, e)}
                      className={`transition-colors ${
                        featuredPost.isBookmarked ? "text-purple-600" : "text-slate-400 hover:text-purple-600"
                      }`}
                    >
                      <Bookmark className={`w-5 h-5 ${featuredPost.isBookmarked ? "fill-purple-600" : ""}`} />
                    </button>
                  </div>
                </div>
              </article>
            )}

            {/* Regular Post Cards */}
            {regularPosts.map(post => (
              <article
                key={post._id}
                onClick={() => navigate(`/community/post/${post._id}`)}
                className="bg-white rounded-3xl overflow-hidden flex flex-col border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                {post.coverImage && (
                  <div className="h-40 w-full overflow-hidden bg-slate-100">
                    <img
                      src={post.coverImage}
                      alt="Cover image"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-3 mb-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-medium">
                      {post.author.avatar ? (
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-bold border">
                          {post.author.name[0]}
                        </div>
                      )}
                      <span>{post.author.name}</span>
                    </div>
                    <span>•</span>
                    <span>{formatAge(post.createdAt)}</span>
                  </div>
                  <span className="inline-block w-max bg-slate-100 px-2.5 py-0.5 rounded-full text-slate-600 font-bold text-xs mb-3">
                    {post.category}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-slate-500 text-sm line-clamp-3 mb-4 flex-grow">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                    <div className="flex gap-4">
                      <button
                        onClick={e => handleLike(post._id, e)}
                        className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${
                          post.isLiked ? "text-purple-600" : "text-slate-400 hover:text-purple-600"
                        }`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${post.isLiked ? "fill-purple-600" : ""}`} />
                        {post.likeCount}
                      </button>
                      <button className="flex items-center gap-1.5 text-slate-400 hover:text-purple-600 text-sm font-bold transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        {post.commentCount}
                      </button>
                    </div>
                    <button
                      onClick={e => handleBookmark(post._id, e)}
                      className={`transition-colors ${
                        post.isBookmarked ? "text-purple-600" : "text-slate-400 hover:text-purple-600"
                      }`}
                    >
                      <Bookmark className={`w-5 h-5 ${post.isBookmarked ? "fill-purple-600" : ""}`} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Simple Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-slate-200 rounded-xl disabled:opacity-50 font-medium hover:bg-slate-50 text-slate-600 transition-colors text-sm"
              >
                Previous
              </button>
              <span className="text-sm font-semibold text-slate-500 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-slate-200 rounded-xl disabled:opacity-50 font-medium hover:bg-slate-50 text-slate-600 transition-colors text-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
