import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  ChevronRight,
  Send,
  Clock,
  ArrowLeft,
  BookOpen,
  Edit3,
  Trash2
} from "lucide-react";
import { getPostDetail, getComments, addComment, toggleLike, toggleBookmark, getPosts, deletePost, toggleLikeComment } from "../../api/post.api";
import { Post, Comment } from "../../types/post";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";

export default function CommunityPostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  


  useEffect(() => {
    if (postId) {
      loadPostDetails(postId);
    }
  }, [postId]);

  const loadPostDetails = async (id: string) => {
    try {
      setLoading(true);
      // Fetch post info
      const postRes = await getPostDetail(id);
      if (postRes.data?.success) {
        setPost(postRes.data.data);
      } else {
        toast.error("Post not found");
        navigate("/community");
        return;
      }

      // Fetch comments
      setCommentsLoading(true);
      const commentsRes = await getComments(id);
      if (commentsRes.data?.success) {
        setComments(commentsRes.data.data || []);
      }

      // Fetch related posts (simple fetch of posts under same category)
      const categoryFilter = postRes.data.data.category;
      const relatedRes = await getPosts({ category: categoryFilter, limit: 3 });
      if (relatedRes.data?.success) {
        // filter out current post
        const filtered = (relatedRes.data.data || []).filter((p: Post) => p._id !== id);
        setRelatedPosts(filtered.slice(0, 2));
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load post details");
    } finally {
      setLoading(false);
      setCommentsLoading(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!post) return;
    try {
      // Optimistic state update
      const likedState = !post.isLiked;
      setPost({
        ...post,
        isLiked: likedState,
        likeCount: likedState ? post.likeCount + 1 : Math.max(0, post.likeCount - 1)
      });
      await toggleLike(post._id);
    } catch (err) {
      toast.error("Failed to update like");
      // refresh details
      if (postId) loadPostDetails(postId);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!post) return;
    try {
      setPost({
        ...post,
        isBookmarked: !post.isBookmarked
      });
      await toggleBookmark(post._id);
      toast.success(post.isBookmarked ? "Removed from library" : "Saved to library");
    } catch (err) {
      toast.error("Failed to update bookmark");
      if (postId) loadPostDetails(postId);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };



  const handleDeletePost = async () => {
    if (!post) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this article? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      const res = await deletePost(post._id);
      if (res.data?.success) {
        toast.success("Post deleted successfully");
        navigate("/community");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete post");
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !newComment.trim()) return;

    try {
      const res = await addComment(post._id, newComment.trim());
      if (res.data?.success) {
        setComments(prev => [...prev, res.data.data]);
        setNewComment("");
        setPost(prev => prev ? { ...prev, commentCount: prev.commentCount + 1 } : null);
        toast.success("Response added");
      }
    } catch (err: any) {
      console.error("Comment submit error details:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to submit comment");
    }
  };

  const handleCommentLike = async (commentId: string) => {
    try {
      setComments(prevComments =>
        prevComments.map(c => {
          if (c._id === commentId) {
            const isLiked = !c.isLiked;
            return {
              ...c,
              isLiked,
              likeCount: isLiked ? (c.likeCount || 0) + 1 : Math.max(0, (c.likeCount || 0) - 1),
            };
          }
          return c;
        })
      );
      await toggleLikeComment(commentId);
    } catch (err) {
      toast.error("Failed to update comment like");
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentCommentId: string) => {
    e.preventDefault();
    if (!post || !replyContent.trim()) return;

    try {
      const res = await addComment(post._id, replyContent.trim(), parentCommentId);
      if (res.data?.success) {
        setComments(prev => [...prev, res.data.data]);
        setReplyContent("");
        setReplyingToId(null);
        setPost(prev => prev ? { ...prev, commentCount: prev.commentCount + 1 } : null);
        toast.success("Reply added");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit reply");
    }
  };

  // Helper to parse inline bold (**), italic (*), and underline (<u>) tags
  const parseInlineStyles = (text: string) => {
    let parts: Array<{ text: string; isBold: boolean; isItalic: boolean; isUnderline: boolean }> = [
      { text, isBold: false, isItalic: false, isUnderline: false }
    ];
    
    // Parse Bold **
    let tempParts: typeof parts = [];
    parts.forEach(p => {
      if (!p.isBold) {
        const split = p.text.split("**");
        split.forEach((s, idx) => {
          tempParts.push({
            text: s,
            isBold: idx % 2 !== 0,
            isItalic: p.isItalic,
            isUnderline: p.isUnderline
          });
        });
      } else {
        tempParts.push(p);
      }
    });
    parts = tempParts;

    // Parse Italic *
    tempParts = [];
    parts.forEach(p => {
      if (!p.isItalic) {
        const split = p.text.split("*");
        split.forEach((s, idx) => {
          tempParts.push({
            text: s,
            isBold: p.isBold,
            isItalic: idx % 2 !== 0,
            isUnderline: p.isUnderline
          });
        });
      } else {
        tempParts.push(p);
      }
    });
    parts = tempParts;

    // Parse Underline <u> and </u>
    tempParts = [];
    parts.forEach(p => {
      if (!p.isUnderline) {
        const split = p.text.split(/<\/?u>/);
        split.forEach((s, idx) => {
          tempParts.push({
            text: s,
            isBold: p.isBold,
            isItalic: p.isItalic,
            isUnderline: idx % 2 !== 0
          });
        });
      } else {
        tempParts.push(p);
      }
    });
    parts = tempParts;

    return parts.map((p, i) => {
      let element: React.ReactNode = p.text;
      if (p.isBold) element = <strong className="font-bold text-slate-800">{element}</strong>;
      if (p.isItalic) element = <em className="italic">{element}</em>;
      if (p.isUnderline) element = <span className="underline">{element}</span>;
      return <span key={i}>{element}</span>;
    });
  };

  // Parses raw text to H1, H2, lists, blockquotes, images, and paragraphs
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // 1. Heading 1: # Title
      if (line.startsWith("# ")) {
        return (
          <h1 key={idx} className="text-3xl font-extrabold text-slate-800 mt-6 mb-3 font-display">
            {parseInlineStyles(line.slice(2))}
          </h1>
        );
      }
      // 2. Heading 2: ## Subtitle
      if (line.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-2xl font-bold text-slate-800 mt-5 mb-2 font-display">
            {parseInlineStyles(line.slice(3))}
          </h2>
        );
      }
      // 3. Heading 3: ### Subtitle
      if (line.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-xl font-bold text-slate-800 mt-4 mb-2 font-display">
            {parseInlineStyles(line.slice(4))}
          </h3>
        );
      }
      // 4. Bullet List: - item or * item
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} className="ml-6 list-disc text-slate-600 my-1 font-body">
            {parseInlineStyles(line.slice(2))}
          </li>
        );
      }
      // 5. Image: ![alt](url)
      const imgRegex = /!\[(.*?)\]\((.*?)\)/;
      const imgMatch = line.match(imgRegex);
      if (imgMatch) {
        return (
          <div key={idx} className="my-4 rounded-3xl overflow-hidden shadow-sm border max-h-[400px]">
            <img src={imgMatch[2]} alt={imgMatch[1]} className="w-full h-full object-cover" />
          </div>
        );
      }
      // 6. Blockquote: > text
      if (line.startsWith("> ")) {
        return (
          <blockquote key={idx} className="border-l-4 border-purple-500 pl-4 my-4 italic text-slate-700 bg-slate-50 py-3 pr-4 rounded-r-xl font-body">
            {parseInlineStyles(line.slice(2))}
          </blockquote>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      // Paragraph
      return (
        <p key={idx} className="text-slate-600 my-2 leading-relaxed font-body text-md">
          {parseInlineStyles(line)}
        </p>
      );
    });
  };

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Loading post details...</p>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-12 animate-fade-in">
      {/* Back to Community Link */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/community"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Community
        </Link>
        <div className="flex items-center gap-1 text-sm text-slate-400 font-medium">
          <Link to="/dashboard" className="hover:text-slate-600">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/community" className="hover:text-slate-600">Community</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700 truncate max-w-[200px]">{post.title}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Article & Comments (Spans 8 cols) */}
        <article className="lg:col-span-8 space-y-10">
          {/* Article Header */}
          <header className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full uppercase tracking-wider">
                {post.category}
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase">
                {post.difficulty}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display text-slate-800 leading-tight tracking-tight">
              {post.title}
            </h1>

            {/* Author Info Row */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                {post.author?.avatar ? (
                  <img
                    src={post.author.avatar}
                    alt={post.author.name || "Author"}
                    className="w-12 h-12 rounded-full object-cover shadow-sm border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold border">
                    {post.author?.name?.[0] || "U"}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{post.author?.name || "Anonymous"}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readingTime} min read
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {user && post.author && user.id === post.author._id && (
                  <button
                    onClick={() => navigate(`/community/post/${post._id}/edit`)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all duration-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                )}

                {user && post.author && (user.id === post.author._id || user.role === "admin") && (
                  <button
                    onClick={handleDeletePost}
                    className="px-4 py-2 rounded-full border border-red-200 bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-all duration-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Cover/Hero Image */}
          <figure className="w-full h-64 md:h-[400px] rounded-3xl overflow-hidden shadow-sm relative bg-slate-50 border">
            {post.coverImage ? (
              <img
                src={post.coverImage}
                alt="Post cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <BookOpen className="w-20 h-20 text-white/20" />
              </div>
            )}
          </figure>

          {/* Article Body Content with Markdown Parsed rendering */}
          <div className="text-slate-600 font-body text-md leading-relaxed space-y-4">
            {renderMarkdown(post.content)}
          </div>

          {/* Interaction Bar */}
          <div className="flex items-center justify-between py-4 border-y border-slate-100 bg-slate-50/40 px-6 rounded-2xl">
            <div className="flex items-center gap-6">
              <button
                onClick={handleLikeToggle}
                className={`flex items-center gap-2 transition-colors ${
                  post.isLiked ? "text-purple-600" : "text-slate-500 hover:text-purple-600"
                }`}
              >
                <Heart className={`w-5 h-5 ${post.isLiked ? "fill-purple-600" : ""}`} />
                <span className="font-bold text-sm">{post.likeCount}</span>
              </button>
              <div className="flex items-center gap-2 text-slate-500">
                <MessageSquare className="w-5 h-5" />
                <span className="font-bold text-sm">{post.commentCount}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleBookmarkToggle}
                className={`p-2 rounded-full hover:bg-slate-100 transition-colors ${
                  post.isBookmarked ? "text-purple-600" : "text-slate-400 hover:text-purple-600"
                } cursor-pointer`}
                title="Save to Library"
              >
                <Bookmark className={`w-5 h-5 ${post.isBookmarked ? "fill-purple-600" : ""}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full hover:text-slate-600 transition-colors cursor-pointer"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <section className="pt-8 space-y-8">
            <h3 className="text-xl font-bold text-slate-800">
              Responses ({comments.length})
            </h3>
            
            {/* Input Comment Box */}
            <form
              onSubmit={handleCommentSubmit}
              className="flex gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm"
            >
              {post.author?.avatar ? (
                <img
                  src={post.author.avatar}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover border"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border font-bold">
                  {post.author?.name?.[0] || "U"}
                </div>
              )}
              <div className="flex-1 space-y-3">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="w-full border-none focus:ring-0 p-0 text-slate-700 placeholder-slate-400 resize-none h-16 text-sm"
                  placeholder="What are your thoughts on this topic?"
                  rows={2}
                />
                <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                  <div className="text-xs text-slate-400">
                    Be polite and supportive in community discussions
                  </div>
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-5 py-2 bg-slate-800 text-white font-bold text-xs rounded-full hover:bg-slate-900 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Respond
                  </button>
                </div>
              </div>
            </form>

            {/* Threaded list of comments and replies */}
            <div className="space-y-4">
              {commentsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">No discussions yet. Share your thoughts!</p>
              ) : (
                <div className="space-y-6">
                  {comments.filter(c => !c.parentComment).map(comment => {
                    const commentReplies = comments.filter(r => r.parentComment === comment._id);
                    return (
                      <div key={comment._id} className="space-y-4">
                        {/* Parent Comment */}
                        <div className="flex gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                          {comment.author?.avatar ? (
                            <img
                              src={comment.author.avatar}
                              alt={comment.author.name || "User"}
                              className="w-10 h-10 rounded-full object-cover border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border font-bold">
                              {comment.author?.name?.[0] || "U"}
                            </div>
                          )}
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-sm">{comment.author?.name || "Anonymous"}</span>
                              <span className="text-xs text-slate-400">
                                {formatAge(comment.createdAt)}
                              </span>
                            </div>
                            
                            <p className="text-slate-600 text-sm leading-relaxed">
                              {comment.content}
                            </p>

                            <div className="flex items-center gap-4 pt-2 text-xs font-bold">
                              <button
                                onClick={() => handleCommentLike(comment._id)}
                                className={`flex items-center gap-1.5 cursor-pointer transition-colors ${
                                  comment.isLiked ? "text-purple-600" : "text-slate-400 hover:text-slate-600"
                                }`}
                              >
                                <Heart className={`w-3.5 h-3.5 ${comment.isLiked ? "fill-purple-600" : ""}`} />
                                <span>{comment.likeCount || 0}</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  setReplyingToId(replyingToId === comment._id ? null : comment._id);
                                  setReplyContent("");
                                }}
                                className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Reply</span>
                              </button>
                            </div>

                            {/* Reply Input Form */}
                            {replyingToId === comment._id && (
                              <form
                                onSubmit={(e) => handleReplySubmit(e, comment._id)}
                                className="mt-3 flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
                              >
                                <textarea
                                  value={replyContent}
                                  onChange={e => setReplyContent(e.target.value)}
                                  placeholder="Reply to this response..."
                                  className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-slate-700 placeholder-slate-400 resize-none h-12 text-xs"
                                  rows={2}
                                />
                                <button
                                  type="submit"
                                  disabled={!replyContent.trim()}
                                  className="self-end px-3 py-1.5 bg-slate-800 text-white font-bold text-[10px] rounded-full hover:bg-slate-900 disabled:opacity-50 transition-colors flex items-center gap-1"
                                >
                                  <Send className="w-2.5 h-2.5" />
                                  Reply
                                </button>
                              </form>
                            )}
                          </div>
                        </div>

                        {/* Nested Replies */}
                        {commentReplies.length > 0 && (
                          <div className="pl-12 space-y-4 border-l-2 border-slate-100">
                            {commentReplies.map(reply => (
                              <div
                                key={reply._id}
                                className="flex gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100 shadow-sm"
                              >
                                {reply.author?.avatar ? (
                                  <img
                                    src={reply.author.avatar}
                                    alt={reply.author.name || "User"}
                                    className="w-8 h-8 rounded-full object-cover border"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border text-xs font-bold">
                                    {reply.author?.name?.[0] || "U"}
                                  </div>
                                )}
                                
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800 text-xs">{reply.author?.name || "Anonymous"}</span>
                                    <span className="text-[10px] text-slate-400">
                                      {formatAge(reply.createdAt)}
                                    </span>
                                  </div>
                                  
                                  <p className="text-slate-600 text-xs leading-relaxed">
                                    {reply.content}
                                  </p>

                                  <div className="flex items-center gap-4 pt-1 text-[10px] font-bold">
                                    <button
                                      onClick={() => handleCommentLike(reply._id)}
                                      className={`flex items-center gap-1 cursor-pointer transition-colors ${
                                        reply.isLiked ? "text-purple-600" : "text-slate-400 hover:text-slate-600"
                                      }`}
                                    >
                                      <Heart className={`w-3 h-3 ${reply.isLiked ? "fill-purple-600" : ""}`} />
                                      <span>{reply.likeCount || 0}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </article>

        {/* Right Column: Sidebar (Spans 4 cols) */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="sticky top-[104px] space-y-8">

            {/* Related Reads List */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h4 className="font-bold text-lg text-slate-800 mb-5">More from MinLish</h4>
              
              <div className="space-y-5">
                {relatedPosts.length === 0 ? (
                  <p className="text-slate-400 text-xs py-4 text-center">No other posts in this category yet.</p>
                ) : (
                  relatedPosts.map(p => (
                    <Link
                      key={p._id}
                      to={`/community/post/${p._id}`}
                      className="group flex gap-4 items-start"
                    >
                      <div className="w-20 h-16 rounded-xl overflow-hidden bg-slate-50 border flex-shrink-0">
                        {p.coverImage ? (
                          <img
                            src={p.coverImage}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white/30 text-xs">
                            Post
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-bold text-slate-800 group-hover:text-purple-600 transition-colors line-clamp-2 leading-snug mb-1">
                          {p.title}
                        </h5>
                        <p className="text-xs text-slate-400">
                          by {p.author?.name || "Anonymous"}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              
              <button
                onClick={() => navigate("/community")}
                className="w-full mt-6 py-2.5 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
              >
                See all related posts
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
