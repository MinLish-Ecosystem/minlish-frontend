import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  ShieldAlert, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  FileText,
  BookOpen,
  Tag,
  Volume2,
  ListChecks,
  MessageSquare,
  Link2,
  User,
  Globe,
  Lock,
  AlertCircle,
  Clock,
  Layout,
  ExternalLink,
  ChevronRight,
  Eye,
  StickyNote,
  Search
} from "lucide-react";
import { 
  getPendingSets, 
  getModerationLogs, 
  overrideModeration,
  listAllPosts,
  overridePostModeration,
  runAutoModeration
} from "../../api/admin.api";
import api from "../../lib/api";
import { toast } from "react-hot-toast";

const PART_OF_SPEECH_LABEL: Record<string, string> = {
  noun: "n.", verb: "v.", adjective: "adj.", adverb: "adv.",
  phrase: "phrase", idiom: "idiom", other: "",
};

const highlightText = (text: string, flaggedTerms?: string[]) => {
  if (!text) return text;
  
  let termsToHighlight: string[] = [];
  if (flaggedTerms && flaggedTerms.length > 0) {
    termsToHighlight = flaggedTerms.filter(t => t && t.trim().length > 0);
  } else {
    // Fallback: local regex matching
    const vulgarRegex = /\b(fuck|shit|bitch|cunt|asshole|porn|xxx|địt|đm|dcm|vcl|lồn|buồi|cặc|dkm|chịch|phịch|đéo|đel)\b/gi;
    const gibberishRegex = /(asdf|qwer|zxcv|ghjk|tyui|bnm|hjkl|jkl;|dfgh|zxcv|xcvb|yuiop|mnbvc|123456)/gi;
    const repRegex = /(.)\1{5,}/g;

    const vulgarMatches = text.match(vulgarRegex) || [];
    const gibMatches = text.match(gibberishRegex) || [];
    const repMatches = text.match(repRegex) || [];

    termsToHighlight = [...vulgarMatches, ...gibMatches, ...repMatches].filter(Boolean);
  }

  if (termsToHighlight.length === 0) return text;

  // Escape regex special chars and sort by length desc to prevent partial matching bugs
  const escapedTerms = termsToHighlight
    .map(t => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => b.length - a.length);

  if (escapedTerms.length === 0) return text;

  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, index) => {
    const isMatch = regex.test(part);
    regex.lastIndex = 0;
    return isMatch ? (
      <mark key={index} className="bg-rose-100 text-rose-700 px-1 rounded font-bold border border-rose-200">
        {part}
      </mark>
    ) : (
      part
    );
  });
};

export default function AdminContentModeration() {
  const [searchParams] = useSearchParams();
  const paramTab = searchParams.get("tab") as "pending" | "moderated" | "ai_logs" | null;
  const paramType = searchParams.get("type") as "sets" | "posts" | null;
  const paramHighlight = searchParams.get("highlightId") || null;

  const [outerTab, setOuterTab] = useState<"sets" | "posts">("sets");
  const [activeTab, setActiveTab] = useState<"pending" | "moderated" | "ai_logs">("pending");
  const [loading, setLoading] = useState(true);
  const [runningAI, setRunningAI] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Word Sets states ──────────────────────────────────────────────────────
  const [pendingSets, setPendingSets] = useState<any[]>([]);
  const [moderatedSets, setModeratedSets] = useState<any[]>([]);
  const [moderatedPagination, setModeratedPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [aiLogsPagination, setAiLogsPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);
  const [setWords, setSetWords] = useState<any[]>([]);
  const [wordsLoading, setWordsLoading] = useState(false);

  const [rejectSetId, setRejectSetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // ─── Community Posts states ────────────────────────────────────────────────
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [moderatedPosts, setModeratedPosts] = useState<any[]>([]);
  const [moderatedPostsPagination, setModeratedPostsPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [aiPosts, setAiPosts] = useState<any[]>([]);
  const [aiPostsPagination, setAiPostsPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  
  const [rejectPostId, setRejectPostId] = useState<string | null>(null);
  const [rejectPostReason, setRejectPostReason] = useState("");

  // ─── AI Logs Details Expansion states ────────────────────────────────────────
  const [expandedLogSetId, setExpandedLogSetId] = useState<string | null>(null);

  // Handle URL params from notification bell redirect
  useEffect(() => {
    if (paramTab) setActiveTab(paramTab);
    if (paramType) setOuterTab(paramType);
    if (paramHighlight && paramTab === "ai_logs") {
      // Auto-expand the matching set/post in the log
      if (paramType === "posts") {
        setExpandedLogPostId(paramHighlight);
      } else {
        setExpandedLogSetId(paramHighlight);
      }
    }
  }, [paramTab, paramType, paramHighlight]);
  const [logSetWords, setLogSetWords] = useState<any[]>([]);
  const [logWordsLoading, setLogWordsLoading] = useState(false);
  const [expandedLogPostId, setExpandedLogPostId] = useState<string | null>(null);
  const [previewPost, setPreviewPost] = useState<any | null>(null);

  const handleJumpToLog = (setId: string, name: string) => {
    setActiveTab("ai_logs");
    setSearchQuery(name);
    setExpandedLogSetId(setId);
  };

  const handleJumpToPostLog = (postId: string, title: string) => {
    setActiveTab("ai_logs");
    setSearchQuery(title);
    setExpandedLogPostId(postId);
  };

  const handleToggleLogSetWords = async (setId: string) => {
    if (expandedLogSetId === setId) {
      setExpandedLogSetId(null);
      setLogSetWords([]);
      return;
    }
    setExpandedLogSetId(setId);
    setLogSetWords([]);
    try {
      setLogWordsLoading(true);
      const res = await api.get(`/api/v1/vocab/sets/${setId}/words`);
      setLogSetWords(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch log set words:", error);
      toast.error("Failed to load vocabulary list");
    } finally {
      setLogWordsLoading(false);
    }
  };

  // ─── Fetch Methods: Word Sets ──────────────────────────────────────────────
  const loadPending = async () => {
    try {
      setLoading(true);
      const res = await getPendingSets();
      setPendingSets(res.data.data || []);
    } catch (error) {
      console.error("Failed to load pending sets:", error);
      toast.error("Không thể tải danh sách bộ từ chờ duyệt");
    } finally {
      setLoading(false);
    }
  };

  const loadModerated = async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/admin/sets`, { params: { page, limit: 10, status: "moderated", q: searchQuery.trim() || undefined } });
      const list = res.data.data || [];
      const filtered = list.filter((s: any) => s.moderationStatus !== "pending");
      setModeratedSets(filtered);
      
      const meta = res.data.meta || {};
      setModeratedPagination({
        page,
        limit: 10,
        total: meta.total || filtered.length,
        totalPages: meta.totalPages || 1,
      });
    } catch (error) {
      console.error("Failed to load moderated sets:", error);
      toast.error("Failed to load moderated vocabulary sets");
    } finally {
      setLoading(false);
    }
  };

  const loadAiLogs = async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await getModerationLogs(page, 10);
      const logs = res.data.data || [];
      setAiLogs(logs);
      
      const meta = res.data.meta || {};
      setAiLogsPagination({
        page,
        limit: 10,
        total: meta.total || 0,
        totalPages: meta.totalPages || 1,
      });
    } catch (error) {
      console.error("Failed to load AI logs:", error);
      toast.error("Failed to load AI moderation logs");
    } finally {
      setLoading(false);
    }
  };

  // ─── Fetch Methods: Community Posts ──────────────────────────────────────────
  const loadPendingPosts = async () => {
    try {
      setLoading(true);
      const res = await listAllPosts(1, 20, "pending");
      setPendingPosts(res.data.data || []);
    } catch (error) {
      console.error("Failed to load pending posts:", error);
      toast.error("Failed to load pending posts");
    } finally {
      setLoading(false);
    }
  };

  const loadModeratedPosts = async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await listAllPosts(page, 10, "moderated", searchQuery.trim() || undefined);
      const list = res.data.data || [];
      setModeratedPosts(list);
      
      const meta = res.data.meta || {};
      setModeratedPostsPagination({
        page,
        limit: 10,
        total: meta.total || list.length,
        totalPages: meta.totalPages || 1
      });
    } catch (error) {
      console.error("Failed to load moderated posts:", error);
      toast.error("Failed to load moderated posts");
    } finally {
      setLoading(false);
    }
  };

  const loadAiPosts = async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await listAllPosts(page, 10, "moderated", searchQuery.trim() || undefined);
      const list = res.data.data || [];
      const filtered = list.filter((p: any) => p.moderationReason && p.moderationReason.trim().length > 0);
      setAiPosts(filtered);
      
      const meta = res.data.meta || {};
      setAiPostsPagination({
        page,
        limit: 10,
        total: meta.total || filtered.length,
        totalPages: meta.totalPages || 1
      });
    } catch (error) {
      console.error("Failed to load AI post logs:", error);
      toast.error("Failed to load AI post logs");
    } finally {
      setLoading(false);
    }
  };

  // ─── Sync Loading on Tab Change ────────────────────────────────────────────

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (outerTab === "sets") {
        if (activeTab === "pending") loadPending();
        else if (activeTab === "moderated") loadModerated(1);
        else if (activeTab === "ai_logs") loadAiLogs(1);
        setExpandedSetId(null);
        setSetWords([]);
      } else {
        if (activeTab === "pending") loadPendingPosts();
        else if (activeTab === "moderated") loadModeratedPosts(1);
        else if (activeTab === "ai_logs") loadAiPosts(1);
        setExpandedPostId(null);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [outerTab, activeTab, searchQuery]);

  // ─── AI Scan Batch Runner ──────────────────────────────────────────────────
  const handleRunAI = async () => {
    setRunningAI(true);
    try {
      toast.loading("Running AI content moderation scan...", { id: "ai_run" });
      const res = await runAutoModeration();
      toast.success("AI has successfully scanned new content!", { id: "ai_run" });
      if (outerTab === "sets") {
        if (activeTab === "pending") loadPending();
        else if (activeTab === "moderated") loadModerated(1);
        else if (activeTab === "ai_logs") loadAiLogs(1);
      } else {
        if (activeTab === "pending") loadPendingPosts();
        else if (activeTab === "moderated") loadModeratedPosts(1);
        else if (activeTab === "ai_logs") loadAiPosts(1);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to run AI content moderation scan", { id: "ai_run" });
    } finally {
      setRunningAI(false);
    }
  };

  // ─── Moderation Handlers: Word Sets ──────────────────────────────────────────
  const handleToggleWords = async (setId: string) => {
    if (expandedSetId === setId) {
      setExpandedSetId(null);
      setSetWords([]);
      return;
    }
    setExpandedSetId(setId);
    setSetWords([]);
    try {
      setWordsLoading(true);
      const res = await api.get(`/api/v1/vocab/sets/${setId}/words`);
      setSetWords(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch set words:", error);
      toast.error("Failed to load vocabulary list for this set");
    } finally {
      setWordsLoading(false);
    }
  };

  const handleApprove = async (setId: string) => {
    try {
      toast.loading("Approving set...", { id: "action" });
      await overrideModeration({ setId, status: "approved", reason: "Manually approved by admin." });
      toast.success("Set approved successfully", { id: "action" });
      if (activeTab === "pending") loadPending();
      else loadModerated(moderatedPagination.page);
    } catch (error) {
      console.error("Failed to approve set:", error);
      toast.error("Approval failed", { id: "action" });
    }
  };

  const handleReject = async () => {
    if (!rejectSetId || !rejectReason.trim()) return;
    try {
      toast.loading("Rejecting set...", { id: "action" });
      await overrideModeration({ setId: rejectSetId, status: "rejected", reason: rejectReason });
      toast.success("Set rejected successfully", { id: "action" });
      setRejectSetId(null);
      setRejectReason("");
      if (activeTab === "pending") loadPending();
      else loadModerated(moderatedPagination.page);
    } catch (error) {
      console.error("Failed to reject set:", error);
      toast.error("Rejection failed", { id: "action" });
    }
  };

  // ─── Moderation Handlers: Community Posts ────────────────────────────────────
  const handleApprovePost = async (postId: string) => {
    try {
      toast.loading("Approving post...", { id: "action" });
      await overridePostModeration({ postId, status: "approved", reason: "Manually approved by admin." });
      toast.success("Post approved successfully", { id: "action" });
      if (activeTab === "pending") loadPendingPosts();
      else loadModeratedPosts(moderatedPostsPagination.page);
    } catch (error) {
      console.error("Failed to approve post:", error);
      toast.error("Approval failed", { id: "action" });
    }
  };

  const handleRejectPost = async () => {
    if (!rejectPostId || !rejectPostReason.trim()) return;
    try {
      toast.loading("Rejecting post...", { id: "action" });
      await overridePostModeration({ postId: rejectPostId, status: "rejected", reason: rejectPostReason });
      toast.success("Post rejected successfully", { id: "action" });
      setRejectPostId(null);
      setRejectPostReason("");
      if (activeTab === "pending") loadPendingPosts();
      else loadModeratedPosts(moderatedPostsPagination.page);
    } catch (error) {
      console.error("Failed to reject post:", error);
      toast.error("Rejection failed", { id: "action" });
    }
  };

  // ─── Word Detail Card ───────────────────────────────────────────────────────
  const renderWordCard = (w: any, idx: number) => (
    <div key={w.id || w._id || idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <div className="flex items-start gap-3 px-4 py-3 border-b border-slate-100">
        {w.imageUrl && (
          <img src={w.imageUrl} alt={w.word} className="w-14 h-14 object-cover rounded-lg border border-slate-100 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-extrabold text-slate-800">{w.word}</span>
            {w.partOfSpeech && (
              <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded font-bold">
                {PART_OF_SPEECH_LABEL[w.partOfSpeech] || w.partOfSpeech}
              </span>
            )}
            {w.pronunciation && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Volume2 className="w-3 h-3" />{w.pronunciation}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-[#4648d4] mt-0.5">{w.meaning}</p>
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        {w.descriptionEN && (
          <p className="text-xs text-slate-500 italic">"{w.descriptionEN}"</p>
        )}
        {w.examples?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1">
              <MessageSquare className="w-3 h-3" /> Examples
            </p>
            <ul className="space-y-0.5">
              {w.examples.map((ex: string, i: number) => (
                <li key={i} className="text-xs text-slate-600 pl-2 border-l-2 border-purple-200">{ex}</li>
              ))}
            </ul>
          </div>
        )}
        {w.note && (
          <div className="flex items-start gap-1.5 p-2 bg-yellow-50 border border-yellow-100 rounded-lg">
            <StickyNote className="w-3 h-3 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-yellow-800">{w.note}</p>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Set Header Card (Pending Tab) ─────────────────────────────────────────
  const renderPendingSetCard = (set: any) => {
    const setId = set._id;
    const creator = set.userId;
    const isExpanded = expandedSetId === setId;

    return (
      <div key={setId} className="bg-white rounded-2xl border border-amber-200/60 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="p-5 flex flex-col md:flex-row gap-4 items-start justify-between">
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <h3 className="text-base font-extrabold text-[#0b1c30]">{set.name}</h3>
              <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold uppercase flex items-center gap-1">
                <Clock className="w-3 h-3" /> Pending
              </span>
            </div>

            {set.description && (
              <p className="text-xs text-slate-500 line-clamp-2">{set.description}</p>
            )}

            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
              <span className="flex items-center gap-1 text-slate-500">
                <User className="w-3 h-3 text-slate-400" />
                <strong className="text-slate-700">{creator?.name || "Unknown"}</strong>
                <span className="text-slate-400">({creator?.email || "—"})</span>
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <BookOpen className="w-3 h-3 text-slate-400" />
                <strong className="text-slate-700">{set.category}</strong>
              </span>
              <span className="text-slate-500">
                Level: <strong className="text-slate-700">{set.level}</strong>
              </span>
              <span className="text-slate-500">
                Words: <strong className="text-slate-700">{set.totalWords}</strong>
              </span>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto shrink-0 flex-wrap md:flex-nowrap">
            <button
              onClick={() => handleToggleWords(setId)}
              className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isExpanded ? <><ChevronUp className="w-3.5 h-3.5" /> Collapse</> : <><ChevronDown className="w-3.5 h-3.5" /> View Content ({set.totalWords})</>}
            </button>
            <button
              onClick={() => handleApprove(setId)}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={() => setRejectSetId(setId)}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-slate-100 bg-slate-50 p-5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Vocabulary Details in this Set
            </h4>
            {wordsLoading ? (
              <div className="flex py-8 justify-center items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" />
                <span className="text-xs text-slate-500">Loading word list...</span>
              </div>
            ) : setWords.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No words have been added to this set yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {setWords.map((w: any, idx: number) => renderWordCard(w, idx))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─── Post Header Card (Pending Tab) ────────────────────────────────────────
  const renderPendingPostCard = (post: any) => {
    const postId = post._id || post.id;
    const author = post.author;
    const isExpanded = expandedPostId === postId;

    return (
      <div key={postId} className="bg-white rounded-2xl border border-amber-200/60 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="p-5 flex flex-col md:flex-row gap-4 items-start justify-between">
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <h3 className="text-base font-extrabold text-[#0b1c30]">{post.title}</h3>
              <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold uppercase flex items-center gap-1">
                <Clock className="w-3 h-3" /> Pending
              </span>
            </div>

            {post.excerpt && (
              <p className="text-xs text-slate-500 line-clamp-2">{post.excerpt}</p>
            )}

            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
              <span className="flex items-center gap-1 text-slate-500">
                <User className="w-3 h-3 text-slate-400" />
                <strong className="text-slate-700">{author?.name || "Anonymous"}</strong>
                <span className="text-slate-400">({author?.email || "—"})</span>
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <BookOpen className="w-3 h-3 text-slate-400" />
                <strong className="text-slate-700">{post.category}</strong>
              </span>
              <span className="text-slate-500">
                Difficulty: <strong className="text-slate-700">{post.difficulty}</strong>
              </span>
              <span className="text-slate-400 font-semibold">
                {new Date(post.createdAt).toLocaleDateString("en-US")} • {post.readingTime || 1} min read
              </span>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto shrink-0 flex-wrap md:flex-nowrap">
            <button
              onClick={() => setExpandedPostId(isExpanded ? null : postId)}
              className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isExpanded ? <><ChevronUp className="w-3.5 h-3.5" /> Collapse</> : <><ChevronDown className="w-3.5 h-3.5" /> View Post Details</>}
            </button>
            <button
              onClick={() => handleApprovePost(postId)}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={() => setRejectPostId(postId)}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-slate-100 bg-slate-50 p-6 space-y-4">
            {post.coverImage && (
              <div className="max-w-md rounded-2xl overflow-hidden border border-slate-200">
                <img src={post.coverImage} alt="Cover image" className="w-full object-cover" />
              </div>
            )}
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brief Excerpt</h4>
              <p className="text-xs text-slate-600 bg-white p-3 border border-slate-200 rounded-xl font-medium">
                {post.excerpt}
              </p>
            </div>
            <div className="space-y-1 pt-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detailed Post Content</h4>
              <div className="text-sm text-slate-700 bg-white p-4 border border-slate-200 rounded-2xl min-h-[150px] font-normal leading-relaxed whitespace-pre-wrap">
                {post.content}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getFilteredPendingSets = () => {
    if (!searchQuery.trim()) return pendingSets;
    const q = searchQuery.toLowerCase().trim();
    return pendingSets.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.description || "").toLowerCase().includes(q) ||
      (s.userId?.name || "").toLowerCase().includes(q) ||
      (s.userId?.email || "").toLowerCase().includes(q) ||
      (s.tags || []).some((t: string) => t.toLowerCase().includes(q))
    );
  };

  const getFilteredPendingPosts = () => {
    if (!searchQuery.trim()) return pendingPosts;
    const q = searchQuery.toLowerCase().trim();
    return pendingPosts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.excerpt || "").toLowerCase().includes(q) ||
      (p.content || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q) ||
      (p.author?.name || "").toLowerCase().includes(q) ||
      (p.author?.email || "").toLowerCase().includes(q)
    );
  };

  const getFilteredAiLogs = () => {
    if (!searchQuery.trim()) return aiLogs;
    const q = searchQuery.toLowerCase().trim();
    return aiLogs.map(log => {
      const filteredResults = (log.results || []).filter((r: any) =>
        r.setName.toLowerCase().includes(q) ||
        (r.creatorName || "").toLowerCase().includes(q) ||
        (r.creatorEmail || "").toLowerCase().includes(q) ||
        (r.reason || "").toLowerCase().includes(q)
      );
      return {
        ...log,
        results: filteredResults,
        setsCount: filteredResults.length
      };
    }).filter(log => log.results.length > 0);
  };

  // ─── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0b1c30]">Content Moderation</h2>
          <p className="text-slate-500 text-sm mt-1">
            Review vocabulary sets & community posts requested for public access. Overwrite status and view AI logs.
          </p>
        </div>
        <button
          onClick={handleRunAI}
          disabled={runningAI}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1000a3] text-white rounded-full font-bold text-xs hover:scale-105 hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50 cursor-pointer"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{runningAI ? "Scanning AI..." : "Run AI Scan"}</span>
        </button>
      </div>

      {/* Outer Level Tabs (Sets vs Posts) */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-full sm:w-fit border border-slate-200/50">
        <button
          onClick={() => {
            setOuterTab("sets");
            setActiveTab("pending");
          }}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            outerTab === "sets"
              ? "bg-white text-[#1000a3] shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Vocabulary Sets ({pendingSets.length})</span>
        </button>
        <button
          onClick={() => {
            setOuterTab("posts");
            setActiveTab("pending");
          }}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            outerTab === "posts"
              ? "bg-white text-[#1000a3] shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Community Posts ({pendingPosts.length})</span>
        </button>
      </div>

      {/* Inner Level Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 gap-3">
        <div className="flex overflow-x-auto hide-scrollbar">
          {[
            { 
              key: "pending", 
              label: `Pending Review (${outerTab === "sets" ? pendingSets.length : pendingPosts.length})` 
            },
            { key: "moderated", label: "Moderated" },
            { key: "ai_logs", label: "Scan log" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-[#1000a3] text-[#1000a3]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar Input */}
        <div className="relative w-full md:w-72 pb-2 md:pb-0 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder={`Search ${outerTab === "sets" ? "sets" : "posts"}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-205 bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all text-xs outline-none"
          />
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="flex h-full w-full items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Loading moderation data...</p>
          </div>
        </div>
      )}

      {/* ─── TAB 1: PENDING ─── */}
      {!loading && activeTab === "pending" && (
        <div className="space-y-4">
          {outerTab === "sets" ? (
            getFilteredPendingSets().length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 flex flex-col items-center">
                <ShieldAlert className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-700 text-base">
                  {searchQuery ? "No matching sets found" : "No vocabulary sets pending review"}
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  {searchQuery ? "Adjust your search terms and try again." : "Your queue is clean!"}
                </p>
              </div>
            ) : (
              getFilteredPendingSets().map((set: any) => renderPendingSetCard(set))
            )
          ) : (
            getFilteredPendingPosts().length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 flex flex-col items-center">
                <ShieldAlert className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-700 text-base">
                  {searchQuery ? "No matching posts found" : "No community posts pending review"}
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  {searchQuery ? "Adjust your search terms and try again." : "All public posts have been reviewed!"}
                </p>
              </div>
            ) : (
              getFilteredPendingPosts().map((post: any) => renderPendingPostCard(post))
            )
          )}
        </div>
      )}

      {/* ─── TAB 2: MODERATED ─── */}
      {!loading && activeTab === "moderated" && (
        <div className="space-y-4">
          {outerTab === "sets" ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold text-xs uppercase tracking-wide">
                      <th className="p-4">Vocabulary Set</th>
                      <th className="p-4">Creator</th>
                      <th className="p-4">Category / Level</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 max-w-xs">Reason</th>
                      <th className="p-4 text-right">Override</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moderatedSets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                          {searchQuery ? "No matching moderated sets found." : "No moderated vocabulary sets found."}
                        </td>
                      </tr>
                    ) : (
                      moderatedSets.map((set: any) => (
                        <tr key={set._id} className="border-b border-slate-5 hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div 
                              onClick={() => handleJumpToLog(set._id, set.name)}
                              className="font-bold text-[#1000a3] hover:underline cursor-pointer text-sm"
                              title="Click to view scan log details"
                            >
                              {set.name}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">ID: {set._id}</div>
                            <div className="text-[10px] text-slate-400">{set.totalWords} words</div>
                          </td>
                          <td className="p-4">
                            <div className="text-xs font-semibold text-slate-700">{set.userId?.name || "—"}</div>
                            <div className="text-[10px] text-slate-400">{set.userId?.email || "—"}</div>
                          </td>
                          <td className="p-4 text-slate-500 text-xs">
                            <div className="font-semibold">{set.category}</div>
                            <div>{set.level}</div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              set.moderationStatus === "approved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : set.moderationStatus === "rejected"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}>
                              {set.moderationStatus === "approved" ? <><Globe className="w-3 h-3" /> Approved</> 
                               : set.moderationStatus === "rejected" ? <><AlertCircle className="w-3 h-3" /> Rejected</>
                               : <><Lock className="w-3 h-3" /> Private</>}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 text-xs italic max-w-[200px] truncate" title={set.moderationReason}>
                            {set.moderationReason || "—"}
                          </td>
                          <td className="p-4 text-right">
                            {set.moderationStatus === "rejected" ? (
                              <button
                                onClick={() => handleApprove(set._id)}
                                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                Re-approve
                              </button>
                            ) : set.moderationStatus === "approved" ? (
                              <button
                                onClick={() => setRejectSetId(set._id)}
                                className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold text-xs uppercase tracking-wide">
                      <th className="p-4">Post</th>
                      <th className="p-4">Author</th>
                      <th className="p-4">Category / Difficulty</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 max-w-xs">Reason</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moderatedPosts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                          {searchQuery ? "No matching moderated posts found." : "No moderated posts found."}
                        </td>
                      </tr>
                    ) : (
                      moderatedPosts.map((post: any) => (
                        <tr key={post._id || post.id} className="border-b border-slate-5 hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div 
                              onClick={() => handleJumpToPostLog(post._id || post.id, post.title)}
                              className="font-bold text-[#1000a3] hover:underline cursor-pointer text-sm"
                              title="Click to view scan log details"
                            >
                              {post.title}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">ID: {post._id || post.id}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-xs font-semibold text-slate-700">{post.author?.name || "Anonymous"}</div>
                            <div className="text-[10px] text-slate-400">{post.author?.email || "—"}</div>
                          </td>
                          <td className="p-4 text-slate-500 text-xs">
                            <div className="font-semibold">{post.category}</div>
                            <div>{post.difficulty}</div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              post.moderationStatus === "approved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : post.moderationStatus === "rejected"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}>
                              {post.moderationStatus === "approved" ? <><Globe className="w-3 h-3" /> Approved</> 
                               : post.moderationStatus === "rejected" ? <><AlertCircle className="w-3 h-3" /> Rejected</>
                               : <><Lock className="w-3 h-3" /> Draft</>}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 text-xs italic max-w-[200px] truncate" title={post.moderationReason}>
                            {post.moderationReason || "—"}
                          </td>
                          <td className="p-4 text-right">
                            {post.moderationStatus === "rejected" ? (
                              <button
                                onClick={() => handleApprovePost(post._id || post.id)}
                                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                Re-approve
                              </button>
                            ) : post.moderationStatus === "approved" ? (
                              <button
                                onClick={() => setRejectPostId(post._id || post.id)}
                                className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: AI SCAN LOGS ─── */}
      {!loading && activeTab === "ai_logs" && (
        <div className="space-y-4">
          {outerTab === "sets" ? (
            getFilteredAiLogs().length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 flex flex-col items-center">
                <FileText className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-700 text-base">
                  {searchQuery ? "No matching scan logs found" : "No AI scan logs yet"}
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  {searchQuery ? "Try adjusting your search query." : "Vocabulary sets auto-moderation history will be shown here."}
                </p>
              </div>
            ) : (
              getFilteredAiLogs().map((log: any) => {
                const isLogHighlighted = log._id === paramHighlight;
                return (
                  <div key={log._id} className={`rounded-2xl border shadow-sm overflow-hidden p-5 space-y-4 transition-all duration-300 ${
                    isLogHighlighted ? "bg-amber-50/10 border-amber-300 ring-2 ring-amber-100" : "bg-white border-slate-200"
                  }`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#0b1c30] text-sm flex items-center gap-1.5">
                          {log.type === "auto" ? (
                            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold text-[10px] border border-indigo-100 uppercase tracking-wide">Auto-Moderation (AI)</span>
                          ) : log.results?.every((r: any) => r.reason === "Manually approved by admin.") ? (
                            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-md font-bold text-[10px] border border-amber-100 uppercase tracking-wide">Quick Moderation</span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 rounded-md font-bold text-[10px] border border-rose-100 uppercase tracking-wide">Manual Moderation</span>
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-400">{new Date(log.runAt).toLocaleString("en-US")}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {log.setsCount} sets
                      </span>
                      <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                        {log.results?.filter((r: any) => r.status === "approved").length || 0} approved
                      </span>
                      <span className="text-xs font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-100">
                        {log.results?.filter((r: any) => r.status === "rejected").length || 0} rejected
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(log.results || []).map((res: any, idx: number) => {
                      const isExpanded = expandedLogSetId === res.setId;
                      const isItemHighlighted = res.setId === paramHighlight;
                      return (
                        <div key={idx} className={`rounded-xl overflow-hidden transition-all border ${
                          isItemHighlighted ? "bg-amber-50 border-amber-300 ring-2 ring-amber-100" : "bg-slate-50 border-slate-100"
                        }`}>
                          <div
                            onClick={() => handleToggleLogSetWords(res.setId)}
                            className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs cursor-pointer hover:bg-slate-100/70 transition-colors"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <strong className="text-slate-800 text-sm">{highlightText(res.setName, res.flaggedTerms)}</strong>
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  res.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-rose-50 text-rose-700"
                                }`}>
                                  {res.status === "approved" ? "Approved" : "Rejected"}
                                </span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </span>
                              </div>
                              <p className="text-slate-400">
                                <span className="font-semibold text-slate-600">{res.creatorName}</span>
                                {" "}({res.creatorEmail}) • {res.wordsCount} words
                              </p>
                            </div>
                            <div className="md:text-right text-[#0b1c30] italic font-medium bg-white px-3 py-2 rounded-lg border border-slate-100 max-w-sm text-xs">
                              "{res.reason}"
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="bg-white border-t border-slate-100 p-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Vocabulary Words List</h5>
                                <a
                                  href={`/admin/vocabulary/${res.setId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-purple-600 font-semibold hover:underline"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Manage Vocabulary Set
                                </a>
                              </div>
                              {logWordsLoading ? (
                                <div className="flex items-center justify-center py-6 gap-2">
                                  <div className="w-5 h-5 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" />
                                  <span className="text-xs text-slate-400 font-medium">Loading vocabulary...</span>
                                </div>
                              ) : logSetWords.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No words in this set.</p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                  {logSetWords.map((word: any) => {
                                    const isFlagged = res.flaggedTerms?.some(
                                      (t: string) => t.toLowerCase() === word.word.toLowerCase()
                                    ) || (res.status === "rejected" && (
                                      word.word.match(/\b(fuck|shit|bitch|cunt|asshole|porn|xxx|địt|đm|dcm|vcl|lồn|buồi|cặc|dkm|chịch|phịch|đéo|đel)\b/i) ||
                                      word.meaning.match(/\b(fuck|shit|bitch|cunt|asshole|porn|xxx|địt|đm|dcm|vcl|lồn|buồi|cặc|dkm|chịch|phịch|đéo|đel)\b/i)
                                    ));
                                    return (
                                      <div
                                        key={word._id}
                                        className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1 transition-all ${
                                          isFlagged
                                            ? "bg-rose-50/50 border-rose-200 shadow-xs"
                                            : "bg-slate-50 border-slate-150"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-1.5">
                                          <div className="flex items-center gap-1 flex-wrap">
                                            <strong className="text-slate-800 text-sm">{highlightText(word.word, res.flaggedTerms)}</strong>
                                            {word.partOfSpeech && (
                                              <span className="text-[10px] text-slate-400 italic font-medium">
                                                {PART_OF_SPEECH_LABEL[word.partOfSpeech.toLowerCase()] || word.partOfSpeech}
                                              </span>
                                            )}
                                          </div>
                                          {isFlagged && (
                                            <span className="text-[8px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-1 py-0.2 rounded-sm uppercase tracking-wide">
                                              Flagged
                                            </span>
                                          )}
                                        </div>
                                        {word.pronunciation && (
                                          <p className="text-[10px] text-slate-400 font-medium">/{word.pronunciation}/</p>
                                        )}
                                        <p className="text-slate-600 text-xs font-semibold leading-relaxed mt-0.5">
                                          {highlightText(word.meaning, res.flaggedTerms)}
                                        </p>
                                        {word.descriptionEN && (
                                          <p className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-2">
                                            {highlightText(word.descriptionEN, res.flaggedTerms)}
                                          </p>
                                        )}
                                      </div>
                                    );
                              })}
                                </div>
                              )}
                            </div>
                          )}
                         </div>
                       );
                     })}
                   </div>
                 </div>
                );
              })
            )
          ) : (
            aiPosts.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 flex flex-col items-center">
                <FileText className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-700 text-base">
                  {searchQuery ? "No matching posts found" : "No AI scan logs yet"}
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  {searchQuery ? "Try adjusting your search query." : "Community posts auto-moderation history will be shown here."}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
                <h4 className="font-bold text-[#0b1c30] text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <ShieldAlert className="w-4 h-4 text-[#1000a3]" />
                  AI Post Moderation Scan History
                </h4>
                <div className="space-y-2.5">
                  {aiPosts.map((post: any) => {
                    const isExpanded = expandedLogPostId === (post._id || post.id);
                    const isPostHighlighted = (post._id || post.id) === paramHighlight;
                    return (
                      <div key={post._id || post.id} className={`rounded-xl overflow-hidden transition-all border ${
                        isPostHighlighted ? "bg-amber-50 border-amber-300 ring-2 ring-amber-100" : "bg-slate-50 border-slate-100 hover:border-indigo-150"
                      }`}>
                        <div
                          onClick={() => setExpandedLogPostId(isExpanded ? null : (post._id || post.id))}
                          className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs cursor-pointer hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className="text-slate-800 text-sm">{highlightText(post.title, post.flaggedTerms)}</strong>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                                post.moderationStatus === "approved"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}>
                                {post.moderationStatus === "approved" ? "Approved" : "Rejected"}
                              </span>
                              {post.moderationReason?.includes("Approved by Administrator") || post.moderationReason?.includes("Manually approved") || post.moderationReason?.includes("Manually rejected") ? (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md font-bold text-[9px] border border-amber-100 uppercase tracking-wide">Quick Moderation</span>
                              ) : post.moderationReason?.includes("by system AI") || post.moderationReason?.includes("Gemini") || post.moderationReason?.includes("auto-moderation") ? (
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold text-[9px] border border-indigo-100 uppercase tracking-wide">Auto-Moderation (AI)</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md font-bold text-[9px] border border-rose-100 uppercase tracking-wide">Manual Moderation</span>
                              )}
                              <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </span>
                            </div>
                            <p className="text-slate-400">
                              Author: <span className="font-semibold text-slate-600">{post.author?.name || "Anonymous"}</span> ({post.author?.email || "—"}) • Category: {post.category}
                            </p>
                          </div>
                          <div className="md:text-right text-[#0b1c30] italic font-medium bg-white px-3 py-2 rounded-lg border border-slate-200 max-w-md text-xs leading-relaxed">
                            "{post.moderationReason}"
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="bg-white border-t border-slate-100 p-5 space-y-4">
                            <div className="flex justify-between items-center">
                              <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Post Excerpt & Content Preview</h5>
                              <button
                                onClick={() => setPreviewPost(post)}
                                className="flex items-center gap-1 text-xs text-purple-600 font-semibold hover:underline bg-transparent border-0 cursor-pointer outline-none"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Open Full Preview
                              </button>
                            </div>

                            <div className="space-y-3 text-slate-700 text-xs leading-relaxed max-h-[300px] overflow-y-auto p-3.5 bg-slate-50 border border-slate-150 rounded-2xl">
                              {post.coverImage && (
                                <img src={post.coverImage} alt="Cover" className="w-24 h-16 object-cover rounded-lg border border-slate-200" />
                              )}
                              <div>
                                <h6 className="font-bold text-slate-800 mb-1">Brief Excerpt:</h6>
                                <p className="text-slate-500 italic">{highlightText(post.excerpt, post.flaggedTerms)}</p>
                              </div>
                              <hr className="border-slate-200/80 my-2" />
                              <div>
                                <h6 className="font-bold text-slate-800 mb-1">Detailed Content:</h6>
                                <p className="whitespace-pre-wrap">{highlightText(post.content, post.flaggedTerms)}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* ─── MODAL: REJECT WORD SET ─── */}
      {rejectSetId && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Reject Vocabulary Set
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Please provide a reason for rejection. This reason will be displayed to the creator so they can modify and resubmit.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Rejection Reason *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Contains profanity or offensive terms..."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => { setRejectSetId(null); setRejectReason(""); }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: REJECT POST ─── */}
      {rejectPostId && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Reject Community Post
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Please provide a reason for rejecting this post. The author will be notified to adjust it.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Rejection Reason *</label>
              <textarea
                value={rejectPostReason}
                onChange={(e) => setRejectPostReason(e.target.value)}
                placeholder="e.g. Contains unauthorized advertisements or inappropriate language..."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => { setRejectPostId(null); setRejectPostReason(""); }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPost}
                disabled={!rejectPostReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: READ-ONLY POST PREVIEW ─── */}
      {previewPost && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-slate-200 shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  Post Preview (Read-Only)
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-1">
                  {previewPost.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewPost(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-0 outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
              {/* Author & Meta */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-150 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-150 text-purple-700 flex items-center justify-center font-bold">
                    {previewPost.author?.name?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{previewPost.author?.name || "Anonymous"}</p>
                    <p className="text-[10px] text-slate-400">{previewPost.author?.email || "No Email"}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                    {previewPost.category}
                  </span>
                  <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-medium">
                    {previewPost.difficulty}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {previewPost.readingTime} min read
                  </span>
                </div>
              </div>

              {/* Cover Image */}
              {previewPost.coverImage && (
                <div className="w-full max-h-60 rounded-2xl overflow-hidden border border-slate-200">
                  <img src={previewPost.coverImage} alt="Cover image" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Excerpt */}
              <div className="border-l-4 border-purple-500 pl-4 py-1 italic text-slate-500 text-xs bg-slate-50/50 rounded-r-lg pr-2">
                <span className="block font-bold text-slate-700 not-italic text-[10px] uppercase tracking-wider mb-0.5">Excerpt:</span>
                {highlightText(previewPost.excerpt, previewPost.flaggedTerms)}
              </div>

              {/* Content */}
              <div className="space-y-4">
                <span className="block font-bold text-slate-700 text-[10px] uppercase tracking-wider mb-0.5">Article Body:</span>
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700 font-normal">
                  {highlightText(previewPost.content, previewPost.flaggedTerms)}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setPreviewPost(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border-0 outline-none"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
