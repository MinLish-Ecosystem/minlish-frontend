import React, { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import {
  ChevronRight,
  Plus,
  Bold,
  Italic,
  Underline,
  Type,
  AlignLeft,
  AlignCenter,
  Image as ImageIcon,
  MoreVertical,
  BookOpen
} from "lucide-react";
import { createPost, getPostDetail, updatePost } from "../../api/post.api";
import toast from "react-hot-toast";

const EDITOR_CATEGORIES = [
  "IELTS Prep",
  "Business English",
  "Grammar",
  "Speaking",
  "Vocabulary",
  "Cultural Tips",
  "General"
];

export default function CommunityEditor() {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const isEditMode = !!postId;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("IELTS Prep");
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [coverImage, setCoverImage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    if (isEditMode && postId) {
      const fetchPostDetails = async () => {
        try {
          const res = await getPostDetail(postId);
          if (res.data?.success && res.data.data) {
            const post = res.data.data;
            setTitle(post.title);
            setContent(post.content);
            setCategory(post.category);
            setDifficulty(post.difficulty);
            setCoverImage(post.coverImage || "");
          }
        } catch (err: any) {
          console.error(err);
          toast.error("Failed to load post details for editing.");
        }
      };
      fetchPostDetails();
    }
  }, [isEditMode, postId]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in both the title and the content.");
      return;
    }

    try {
      setSubmitting(true);
      if (isEditMode && postId) {
        const res = await updatePost(postId, {
          title: title.trim(),
          content: content.trim(),
          category,
          difficulty,
          coverImage: coverImage.trim() || undefined,
        });

        if (res.data?.success) {
          toast.success("Post updated successfully!");
          navigate(`/community/post/${postId}`);
        }
      } else {
        const res = await createPost({
          title: title.trim(),
          content: content.trim(),
          category,
          difficulty,
          coverImage: coverImage.trim() || undefined,
          isFeatured: false
        });

        if (res.data?.success) {
          toast.success("Post published successfully!");
          navigate("/community");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || `Failed to ${isEditMode ? "update" : "publish"} post`);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to insert styling tags in textarea
  const insertFormatting = (tagOpen: string, tagClose: string) => {
    const textarea = document.getElementById("editor-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = tagOpen + selected + tagClose;

    setContent(text.substring(0, start) + replacement + text.substring(end));
    
    // reset selection focus
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagOpen.length, start + tagOpen.length + selected.length);
    }, 0);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 pt-4">
      {/* Context Header Breadcrumbs */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Link to="/dashboard" className="hover:text-slate-800 transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/community" className="hover:text-slate-800 transition-colors">Community</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-800">{isEditMode ? "Edit Article" : "Create New Article"}</span>
        </div>
        
        <div className="flex items-center gap-3">
        </div>
      </div>

      {/* Editor Canvas (Glassmorphism / Elevated Card) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-10 relative overflow-hidden space-y-6">
        
        {/* Category & Difficulty Selection */}
        <div className="flex flex-wrap items-center gap-6 pb-4 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</span>
            <div className="flex flex-wrap gap-2">
              {EDITOR_CATEGORIES.map(cat => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Difficulty</span>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-300 outline-none cursor-pointer"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Optional Cover Image Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Cover Image URL (Optional)
          </label>
          <input
            type="text"
            placeholder="Paste Unsplash / web image URL here..."
            value={coverImage}
            onChange={e => setCoverImage(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-purple-300 focus:outline-none focus:border-transparent transition-all outline-none"
          />
        </div>

        {/* Title Input */}
        <input
          type="text"
          placeholder="Article Title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full text-4xl md:text-5xl font-bold font-display text-slate-800 placeholder-slate-200 border-none focus:ring-0 px-0 bg-transparent outline-none"
        />

        {/* Sticky Rich Text Toolbar */}
        <div className="sticky top-20 z-20 bg-white/95 backdrop-blur border border-slate-200 rounded-2xl p-2 flex flex-wrap items-center gap-1 shadow-sm">
          {/* Formatting Options */}
          <div className="flex items-center gap-0.5 px-2 border-r border-slate-200">
            <button
              type="button"
              onClick={() => insertFormatting("**", "**")}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("*", "*")}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("<u>", "</u>")}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="Underline"
            >
              <Underline className="w-4 h-4" />
            </button>
          </div>

          {/* Heading Style buttons */}
          <div className="flex items-center gap-0.5 px-2 border-r border-slate-200">
            <button
              type="button"
              onClick={() => insertFormatting("\n# ", "\n")}
              className="px-2 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors text-xs font-extrabold"
              title="Heading 1"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("\n## ", "\n")}
              className="px-2 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors text-xs font-bold"
              title="Heading 2"
            >
              H2
            </button>
          </div>

          {/* Dummy placeholders for layout */}
          <div className="flex items-center gap-0.5 px-2">
            <button
              type="button"
              onClick={() => insertFormatting(" - ", "")}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="Bullet List"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("![](", ")")}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="Add Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1" />
          
          <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content Editable / Textarea Canvas */}
        <div className="relative min-h-[400px]">
          <textarea
            id="editor-textarea"
            placeholder="Start typing your story here (Markdown supported)..."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full min-h-[400px] text-lg text-slate-600 leading-relaxed font-body border-none focus:ring-0 p-0 resize-y bg-transparent outline-none placeholder:text-slate-300"
          />
        </div>

        {/* Footer Action Area */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <div className="text-sm text-slate-400 font-semibold">
            Words: <span className="text-slate-600">{wordCount}</span>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => (isEditMode && postId ? navigate(`/community/post/${postId}`) : navigate("/community"))}
              className="px-6 py-2.5 border border-slate-200 rounded-full font-bold text-sm text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handlePublish}
              className="px-6 py-2.5 bg-[#4648d4] text-white rounded-full font-bold text-sm shadow-md hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {submitting 
                ? (isEditMode ? "Saving..." : "Publishing...") 
                : (isEditMode ? "Save Changes" : "Publish Article")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
