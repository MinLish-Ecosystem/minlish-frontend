import { useState, useEffect } from "react";
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
  Lightbulb,
  StickyNote,
  Image,
  User,
  Globe,
  Lock,
  AlertCircle,
  Clock
} from "lucide-react";
import { 
  getPendingSets, 
  getModerationLogs, 
  overrideModeration,
} from "../../api/admin.api";
import api from "../../lib/api";
import { toast } from "react-hot-toast";

const PART_OF_SPEECH_LABEL: Record<string, string> = {
  noun: "n.", verb: "v.", adjective: "adj.", adverb: "adv.",
  phrase: "phrase", idiom: "idiom", other: "",
};

export default function AdminContentModeration() {
  const [activeTab, setActiveTab] = useState<"pending" | "moderated" | "ai_logs">("pending");
  const [loading, setLoading] = useState(true);

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
      const res = await api.get(`/api/v1/admin/sets`, { params: { page, limit: 10 } });
      const payload = res.data.data;
      const list = payload?.data || payload || [];
      const filtered = list.filter((s: any) => s.moderationStatus !== "pending");
      setModeratedSets(filtered);
      setModeratedPagination({
        page,
        limit: 10,
        total: payload?.pagination?.total || filtered.length,
        totalPages: payload?.pagination?.totalPages || 1,
      });
    } catch (error) {
      console.error("Failed to load moderated sets:", error);
      toast.error("Không thể tải danh sách bộ từ đã duyệt");
    } finally {
      setLoading(false);
    }
  };

  const loadAiLogs = async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await getModerationLogs(page, 10);
      const payload = res.data.data;
      setAiLogs(payload?.data || []);
      setAiLogsPagination({
        page,
        limit: 10,
        total: payload?.pagination?.total || 0,
        totalPages: payload?.pagination?.totalPages || 1,
      });
    } catch (error) {
      console.error("Failed to load AI logs:", error);
      toast.error("Không thể tải nhật ký AI");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "pending") loadPending();
    else if (activeTab === "moderated") loadModerated(1);
    else if (activeTab === "ai_logs") loadAiLogs(1);
    setExpandedSetId(null);
    setSetWords([]);
  }, [activeTab]);

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
      toast.error("Không thể tải từ vựng của bộ từ này");
    } finally {
      setWordsLoading(false);
    }
  };

  const handleApprove = async (setId: string) => {
    try {
      toast.loading("Đang duyệt bộ từ...", { id: "action" });
      await overrideModeration({ setId, status: "approved", reason: "Duyệt thủ công bởi quản trị viên." });
      toast.success("Đã phê duyệt bộ từ vựng công khai thành công", { id: "action" });
      if (activeTab === "pending") loadPending();
      else loadModerated(moderatedPagination.page);
    } catch (error) {
      console.error("Failed to approve set:", error);
      toast.error("Phê duyệt thất bại", { id: "action" });
    }
  };

  const handleReject = async () => {
    if (!rejectSetId || !rejectReason.trim()) return;
    try {
      toast.loading("Đang từ chối bộ từ...", { id: "action" });
      await overrideModeration({ setId: rejectSetId, status: "rejected", reason: rejectReason });
      toast.success("Đã từ chối công khai bộ từ vựng", { id: "action" });
      setRejectSetId(null);
      setRejectReason("");
      if (activeTab === "pending") loadPending();
      else loadModerated(moderatedPagination.page);
    } catch (error) {
      console.error("Failed to reject set:", error);
      toast.error("Từ chối thất bại", { id: "action" });
    }
  };

  // ─── Word Detail Card ─────────────────────────────────────────────────────

  const renderWordCard = (w: any, idx: number) => (
    <div key={w.id || w._id || idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Word Header */}
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
          {w.descriptionEN && (
            <p className="text-xs text-slate-500 mt-0.5 italic">"{w.descriptionEN}"</p>
          )}
        </div>
      </div>

      {/* Word Details */}
      <div className="px-4 py-3 space-y-2">
        {w.examples?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1">
              <MessageSquare className="w-3 h-3" /> Ví dụ
            </p>
            <ul className="space-y-0.5">
              {w.examples.map((ex: string, i: number) => (
                <li key={i} className="text-xs text-slate-600 pl-2 border-l-2 border-purple-200">{ex}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {w.synonyms?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Đồng nghĩa
              </p>
              <div className="flex flex-wrap gap-1">
                {w.synonyms.map((s: string, i: number) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100">{s}</span>
                ))}
              </div>
            </div>
          )}
          {w.antonyms?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <X className="w-3 h-3" /> Trái nghĩa
              </p>
              <div className="flex flex-wrap gap-1">
                {w.antonyms.map((s: string, i: number) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded border border-rose-100">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {w.collocations?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <ListChecks className="w-3 h-3" /> Collocations
            </p>
            <div className="flex flex-wrap gap-1">
              {w.collocations.map((c: string, i: number) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-100">{c}</span>
              ))}
            </div>
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

  // ─── Set Header Card (for Pending Tab) ────────────────────────────────────

  const renderPendingSetCard = (set: any) => {
    const setId = set._id;
    const creator = set.userId;
    const isExpanded = expandedSetId === setId;

    return (
      <div key={setId} className="bg-white rounded-2xl border border-amber-200/60 shadow-sm overflow-hidden transition-all hover:shadow-md">
        {/* Set Summary Row */}
        <div className="p-5 flex flex-col md:flex-row gap-4 items-start justify-between">
          <div className="flex-1 space-y-2 min-w-0">
            {/* Title + badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <h3 className="text-base font-extrabold text-[#0b1c30]">{set.name}</h3>
              <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold uppercase flex items-center gap-1">
                <Clock className="w-3 h-3" /> Chờ duyệt
              </span>
            </div>

            {/* Description */}
            {set.description && (
              <p className="text-xs text-slate-500 line-clamp-2">{set.description}</p>
            )}

            {/* Meta grid */}
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
                Trình độ: <strong className="text-slate-700">{set.level}</strong>
              </span>
              <span className="text-slate-500">
                Số từ: <strong className="text-slate-700">{set.totalWords}</strong>
              </span>
              {set.tags?.length > 0 && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Tag className="w-3 h-3" />
                  {set.tags.join(", ")}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full md:w-auto shrink-0 flex-wrap md:flex-nowrap">
            <button
              onClick={() => handleToggleWords(setId)}
              className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              {isExpanded ? <><ChevronUp className="w-3.5 h-3.5" /> Thu gọn</> : <><ChevronDown className="w-3.5 h-3.5" /> Xem nội dung ({set.totalWords})</>}
            </button>

            <button
              onClick={() => handleApprove(setId)}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" /> Duyệt
            </button>

            <button
              onClick={() => setRejectSetId(setId)}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <X className="w-3.5 h-3.5" /> Từ chối
            </button>
          </div>
        </div>

        {/* Expanded Word Detail */}
        {isExpanded && (
          <div className="border-t border-slate-100 bg-slate-50 p-5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Chi tiết Từ vựng trong bộ từ này
            </h4>
            {wordsLoading ? (
              <div className="flex py-8 justify-center items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" />
                <span className="text-xs text-slate-500">Đang tải danh sách từ...</span>
              </div>
            ) : setWords.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">Bộ từ này chưa được thêm từ vựng nào.</p>
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

  // ─── JSX ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0b1c30]">Kiểm duyệt Nội dung</h2>
        <p className="text-slate-500 text-sm mt-1">
          Duyệt các bộ từ vựng được yêu cầu công khai. Hỗ trợ xem lại lịch sử AI và ghi đè trạng thái.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { key: "pending", label: `Chờ duyệt (${pendingSets.length})` },
          { key: "moderated", label: "Đã duyệt" },
          { key: "ai_logs", label: "Nhật ký Quét AI" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === tab.key
                ? "border-[#1000a3] text-[#1000a3]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex h-full w-full items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Đang tải dữ liệu kiểm duyệt...</p>
          </div>
        </div>
      )}

      {/* Tab 1: Pending */}
      {!loading && activeTab === "pending" && (
        <div className="space-y-4">
          {pendingSets.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 flex flex-col items-center">
              <ShieldAlert className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700 text-base">Không có bộ từ nào chờ duyệt</h3>
              <p className="text-slate-400 text-xs mt-1">Hệ thống của bạn đang hoàn toàn sạch sẽ!</p>
            </div>
          ) : (
            pendingSets.map((set: any) => renderPendingSetCard(set))
          )}
        </div>
      )}

      {/* Tab 2: Moderated */}
      {!loading && activeTab === "moderated" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold text-xs uppercase tracking-wide">
                    <th className="p-4">Bộ từ vựng</th>
                    <th className="p-4">Người tạo</th>
                    <th className="p-4">Danh mục / Trình độ</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 max-w-xs">Lý do</th>
                    <th className="p-4 text-right">Override</th>
                  </tr>
                </thead>
                <tbody>
                  {moderatedSets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                        Không có bộ từ nào đã được duyệt.
                      </td>
                    </tr>
                  ) : (
                    moderatedSets.map((set: any) => (
                      <tr key={set._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-800 text-sm">{set.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">ID: {set._id}</div>
                          <div className="text-[10px] text-slate-400">{set.totalWords} từ</div>
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
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border ${
                            set.moderationStatus === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : set.moderationStatus === "rejected"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}>
                            {set.moderationStatus === "approved" ? <><Globe className="w-3 h-3" /> Đã duyệt</> 
                             : set.moderationStatus === "rejected" ? <><AlertCircle className="w-3 h-3" /> Từ chối</>
                             : <><Lock className="w-3 h-3" /> Riêng tư</>}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 text-xs italic max-w-[200px] truncate" title={set.moderationReason}>
                          {set.moderationReason || "—"}
                        </td>
                        <td className="p-4 text-right">
                          {set.moderationStatus === "rejected" ? (
                            <button
                              onClick={() => handleApprove(set._id)}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all"
                            >
                              Duyệt lại
                            </button>
                          ) : set.moderationStatus === "approved" ? (
                            <button
                              onClick={() => setRejectSetId(set._id)}
                              className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all"
                            >
                              Thu hồi
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
        </div>
      )}

      {/* Tab 3: AI Logs */}
      {!loading && activeTab === "ai_logs" && (
        <div className="space-y-4">
          {aiLogs.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 flex flex-col items-center">
              <FileText className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700 text-base">Chưa có nhật ký quét AI nào</h3>
              <p className="text-slate-400 text-xs mt-1">Lịch sử chạy kiểm duyệt tự động sẽ hiển thị tại đây.</p>
            </div>
          ) : (
            aiLogs.map((log: any) => (
              <div key={log._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#0b1c30] text-sm">
                        {log.type === "auto" ? "Kiểm duyệt Tự động (AI)" : "Kiểm duyệt Thủ công"}
                      </h4>
                      <p className="text-[10px] text-slate-400">{new Date(log.runAt).toLocaleString("vi-VN")}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {log.setsCount} bộ từ
                    </span>
                    <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                      {log.results?.filter((r: any) => r.status === "approved").length || 0} duyệt
                    </span>
                    <span className="text-xs font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-100">
                      {log.results?.filter((r: any) => r.status === "rejected").length || 0} từ chối
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {(log.results || []).map((res: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-800 text-sm">{res.setName}</strong>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            res.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-rose-50 text-rose-700"
                          }`}>
                            {res.status === "approved" ? "Đã duyệt" : "Từ chối"}
                          </span>
                        </div>
                        <p className="text-slate-400">
                          <span className="font-semibold text-slate-600">{res.creatorName}</span>
                          {" "}({res.creatorEmail}) • {res.wordsCount} từ
                        </p>
                      </div>
                      <div className="md:text-right text-[#0b1c30] italic font-medium bg-white px-3 py-2 rounded-lg border border-slate-100 max-w-sm text-xs">
                        "{res.reason}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectSetId && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Từ chối bộ từ vựng
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Vui lòng cung cấp lý do từ chối. Lý do sẽ được hiển thị cho người tạo biết để chỉnh sửa và gửi lại.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Lý do từ chối *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Chứa các từ tục tĩu vi phạm thuần phong mỹ tục..."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => { setRejectSetId(null); setRejectReason(""); }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xác nhận Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
