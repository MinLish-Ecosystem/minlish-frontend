import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  AlertCircle,
  FileText,
  Eye
} from "lucide-react";
import { 
  getPendingSets, 
  getModerationLogs, 
  overrideModeration,
  getSystemConfig
} from "../../api/admin.api";
import api from "../../lib/api"; // Dùng để gọi lấy từ vựng
import { toast } from "react-hot-toast";

export default function AdminContentModeration() {
  const [activeTab, setActiveTab] = useState<"pending" | "moderated" | "ai_logs">("pending");
  const [loading, setLoading] = useState(true);

  // States dữ liệu
  const [pendingSets, setPendingSets] = useState<any[]>([]);
  const [moderatedSets, setModeratedSets] = useState<any[]>([]);
  const [moderatedPagination, setModeratedPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [aiLogsPagination, setAiLogsPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  
  // State mở rộng từ vựng của set
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);
  const [setWords, setSetWords] = useState<any[]>([]);
  const [wordsLoading, setWordsLoading] = useState(false);

  // States của modal Từ chối (Reject)
  const [rejectSetId, setRejectSetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadPending = async () => {
    try {
      setLoading(true);
      const res = await getPendingSets();
      setPendingSets(res.data.data);
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
      // Gọi API lấy toàn bộ public sets của admin
      const res = await api.get(`/api/v1/admin/sets`, { params: { page, limit: 10 } });
      const data = res.data.data;
      
      // Lọc các bộ từ đã được duyệt (approved/rejected)
      const list = data.data || [];
      const filtered = list.filter((s: any) => s.moderationStatus !== "pending");

      setModeratedSets(filtered);
      setModeratedPagination({
        page,
        limit: 10,
        total: data.pagination?.total || filtered.length,
        totalPages: data.pagination?.totalPages || 1
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
      const data = res.data.data;
      setAiLogs(data.data || []);
      setAiLogsPagination({
        page,
        limit: 10,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1
      });
    } catch (error) {
      console.error("Failed to load AI logs:", error);
      toast.error("Không thể tải nhật ký AI");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "pending") {
      loadPending();
    } else if (activeTab === "moderated") {
      loadModerated(1);
    } else if (activeTab === "ai_logs") {
      loadAiLogs(1);
    }
    setExpandedSetId(null);
    setSetWords([]);
  }, [activeTab]);

  // Expand để xem từ vựng bên trong
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
      const res = await api.get(`/api/v1/vocab/${setId}/words`);
      setSetWords(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch set words:", error);
      toast.error("Không thể tải từ vựng của bộ từ này");
    } finally {
      setWordsLoading(false);
    }
  };

  // Duyệt
  const handleApprove = async (setId: string) => {
    try {
      toast.loading("Đang duyệt bộ từ...", { id: "action" });
      await overrideModeration({
        setId,
        status: "approved",
        reason: "Duyệt thủ công bởi quản trị viên."
      });
      toast.success("Đã phê duyệt bộ từ vựng công khai thành công", { id: "action" });
      
      if (activeTab === "pending") loadPending();
      else loadModerated(moderatedPagination.page);
    } catch (error) {
      console.error("Failed to approve set:", error);
      toast.error("Phê duyệt thất bại", { id: "action" });
    }
  };

  // Từ chối
  const handleReject = async () => {
    if (!rejectSetId || !rejectReason.trim()) return;
    try {
      toast.loading("Đang từ chối bộ từ...", { id: "action" });
      await overrideModeration({
        setId: rejectSetId,
        status: "rejected",
        reason: rejectReason
      });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0b1c30]">Kiểm duyệt Nội dung</h2>
        <p className="text-slate-500 text-sm mt-1">
          Duyệt các bộ từ vựng được yêu cầu công khai. Hỗ trợ xem lại lịch sử AI và ghi đè trạng thái.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "pending"
              ? "border-[#1000a3] text-[#1000a3]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Chờ duyệt ({pendingSets.length})
        </button>
        <button
          onClick={() => setActiveTab("moderated")}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "moderated"
              ? "border-[#1000a3] text-[#1000a3]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Đã duyệt
        </button>
        <button
          onClick={() => setActiveTab("ai_logs")}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "ai_logs"
              ? "border-[#1000a3] text-[#1000a3]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Nhật ký Quét AI
        </button>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="flex h-full w-full items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Đang tải dữ liệu kiểm duyệt...</p>
          </div>
        </div>
      )}

      {/* Tab 1 Content: Pending */}
      {!loading && activeTab === "pending" && (
        <div className="space-y-4">
          {pendingSets.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 flex flex-col items-center">
              <ShieldAlert className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700 text-base">Không có bộ từ nào chờ duyệt</h3>
              <p className="text-slate-400 text-xs mt-1">Hệ thống của bạn đang hoàn toàn sạch sẽ!</p>
            </div>
          ) : (
            pendingSets.map((set: any) => (
              <div key={set._id} className="bg-white rounded-2xl border border-[#c7c4d7]/40 shadow-sm overflow-hidden transition-all hover:shadow-md">
                <div className="p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-[#0b1c30]">{set.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold uppercase">
                        Pending
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{set.description || "Không có mô tả."}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-semibold pt-1">
                      <span>Người tạo: <strong className="text-slate-600">{set.userId?.name || "Unknown"}</strong> ({set.userId?.email})</span>
                      <span>Chủ đề: <strong className="text-slate-600">{set.category}</strong></span>
                      <span>Trình độ: <strong className="text-slate-600">{set.level}</strong></span>
                      <span>Số từ: <strong className="text-slate-600">{set.totalWords}</strong></span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto pt-4 md:pt-0 shrink-0">
                    <button
                      onClick={() => handleToggleWords(set._id)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 w-full md:w-auto justify-center"
                    >
                      {expandedSetId === set._id ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" /> Ẩn từ vựng
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" /> Xem từ vựng ({set.totalWords})
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleApprove(set._id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 w-full md:w-auto justify-center shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" /> Duyệt
                    </button>

                    <button
                      onClick={() => setRejectSetId(set._id)}
                      className="px-4 py-2 bg-[#ba1a1a] hover:bg-[#ba1a1a]/90 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 w-full md:w-auto justify-center shadow-sm"
                    >
                      <X className="w-3.5 h-3.5" /> Từ chối
                    </button>
                  </div>
                </div>

                {/* Expanded Words Preview */}
                {expandedSetId === set._id && (
                  <div className="bg-slate-50 border-t border-slate-100 p-5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Danh sách từ vựng bên trong</h4>
                    {wordsLoading ? (
                      <div className="flex py-6 justify-center items-center gap-2">
                        <div className="w-5 h-5 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" />
                        <span className="text-xs text-slate-500">Đang tải danh sách từ...</span>
                      </div>
                    ) : setWords.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Bộ từ này chưa được thêm từ vựng nào.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {setWords.map((w: any) => (
                          <div key={w.id || w.word} className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-sm flex items-start gap-2.5">
                            {w.imageUrl && (
                              <img src={w.imageUrl} alt={w.word} className="w-10 h-10 object-cover rounded-lg shrink-0 border border-slate-100" />
                            )}
                            <div>
                              <h5 className="font-bold text-sm text-[#0b1c30]">{w.word}</h5>
                              <p className="text-xs text-[#8127cf] font-semibold">{w.phonetic}</p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{w.translation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2 Content: Moderated (Approved/Rejected) */}
      {!loading && activeTab === "moderated" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#c7c4d7]/40 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#f8f9ff]/50 text-slate-400 font-semibold">
                    <th className="p-4">Bộ từ vựng</th>
                    <th className="p-4">Danh mục</th>
                    <th className="p-4">Trình độ</th>
                    <th className="p-4">Trạng thái duyệt</th>
                    <th className="p-4">Lý do duyệt/từ chối</th>
                    <th className="p-4 text-right">Duyệt đè (Override)</th>
                  </tr>
                </thead>
                <tbody>
                  {moderatedSets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        Không có bộ từ nào đã được duyệt.
                      </td>
                    </tr>
                  ) : (
                    moderatedSets.map((set: any) => (
                      <tr key={set._id} className="border-b border-slate-50 hover:bg-[#f8f9ff]/10 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-[#0b1c30]">{set.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">ID: {set._id}</div>
                        </td>
                        <td className="p-4 text-slate-500 font-semibold">{set.category}</td>
                        <td className="p-4 text-slate-500">{set.level}</td>
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            set.moderationStatus === "approved" 
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                              : "bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb59f]"
                          }`}>
                            {set.moderationStatus}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 text-xs italic max-w-xs truncate" title={set.moderationReason}>
                          {set.moderationReason || "Không có ghi chú."}
                        </td>
                        <td className="p-4 text-right space-x-1 shrink-0">
                          {set.moderationStatus === "rejected" ? (
                            <button
                              onClick={() => handleApprove(set._id)}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all"
                            >
                              Approve
                            </button>
                          ) : (
                            <button
                              onClick={() => setRejectSetId(set._id)}
                              className="px-2.5 py-1 bg-[#ffdad6] text-[#93000a] border border-[#ffb59f] hover:bg-[#ffdad6]/80 rounded-lg text-xs font-bold transition-all"
                            >
                              Reject
                            </button>
                          )}
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

      {/* Tab 3 Content: AI Logs */}
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
              <div key={log._id} className="bg-white rounded-2xl border border-[#c7c4d7]/40 shadow-sm overflow-hidden p-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#0b1c30] text-sm">
                        Đợt kiểm duyệt {log.type === "auto" ? "Tự động (AI)" : "Thủ công"}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {new Date(log.runAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      Tổng số xử lý: {log.setsCount} bộ từ
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {log.results.map((res: any, idx: number) => (
                    <div key={idx} className="p-3 bg-[#f8f9ff] border border-slate-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-800 text-sm">{res.setName}</strong>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            res.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-[#ffdad6] text-[#ba1a1a]"
                          }`}>
                            {res.status}
                          </span>
                        </div>
                        <p className="text-slate-400">
                          Người tạo: <span className="font-semibold text-slate-600">{res.creatorName}</span> ({res.creatorEmail}) • Từ vựng: {res.wordsCount} từ
                        </p>
                      </div>
                      <div className="md:text-right text-[#0b1c30] italic font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-100 max-w-md">
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

      {/* Modal: Từ chối bộ từ công khai */}
      {rejectSetId && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-[#c7c4d7]/40 shadow-xl space-y-4 animate-scale-up">
            <h3 className="text-lg font-bold text-[#ba1a1a]">Từ chối công khai bộ từ</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Vui lòng cung cấp lý do từ chối công khai bộ từ này. Lý do sẽ hiển thị cho người tạo bộ từ biết để chỉnh sửa.
            </p>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Lý do từ chối</label>
              <textarea 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Chứa các từ tục tĩu vi phạm thuần phong mỹ tục..."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ba1a1a] focus:border-transparent transition-all"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => { setRejectSetId(null); setRejectReason(""); }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 bg-[#ba1a1a] hover:bg-[#ba1a1a]/90 text-white font-bold rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
