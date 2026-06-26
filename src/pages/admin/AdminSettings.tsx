import { useState, useEffect } from "react";
import { 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  Mail, 
  HardDrive, 
  ShieldCheck, 
  Settings2,
  Info,
  Sliders,
  Brain
} from "lucide-react";
import { getSystemConfig, updateSystemConfig, SystemConfigData } from "../../api/admin.api";
import { toast } from "react-hot-toast";

export default function AdminSettings() {
  const [config, setConfig] = useState<SystemConfigData | null>(null);
  const [formData, setFormData] = useState<SystemConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await getSystemConfig();
      setConfig(res.data.data);
      setFormData(res.data.data);
    } catch (error) {
      console.error("Failed to fetch system config:", error);
      toast.error("Không thể tải cấu hình hệ thống");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleChange = (key: keyof SystemConfigData, value: any) => {
    if (!formData) return;
    setFormData({
      ...formData,
      [key]: value
    });
  };

  const handleDiscard = () => {
    setFormData(config);
    toast.success("Đã hoàn tác các thay đổi chưa lưu");
  };

  const handleSave = async () => {
    if (!formData) return;
    try {
      setSaving(true);
      toast.loading("Đang lưu cấu hình...", { id: "save" });
      const res = await updateSystemConfig(formData);
      setConfig(res.data.data);
      setFormData(res.data.data);
      toast.success("Đã cập nhật cấu hình hệ thống thành công!", { id: "save" });
    } catch (error) {
      console.error("Failed to save config:", error);
      toast.error("Lưu cấu hình thất bại", { id: "save" });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !formData) {
    return (
      <div className="flex h-full w-full items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Đang tải cấu hình hệ thống...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0b1c30]">Cấu hình Hệ thống</h2>
          <p className="text-slate-500 text-sm mt-1">
            Điều chỉnh cài đặt vận hành, chính sách bảo mật, thuật toán SRS và nguyên tắc kiểm duyệt AI.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={handleDiscard}
            disabled={saving}
            className="px-4 py-2 rounded-xl font-semibold text-[#1000a3] hover:bg-[#1000a3]/5 transition-colors border border-transparent disabled:opacity-50"
          >
            Hủy thay đổi
          </button>
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#1000a3] hover:bg-[#1000a3]/90 shadow-md transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Lưu Cấu hình
          </button>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        
        {/* Maintenance Mode Alert Box */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
          {/* Accent border top */}
          <div className="h-[3px] w-full bg-[#ba1a1a] absolute top-0 left-0"></div>
          <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0 mt-1">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0b1c30] flex items-center gap-3">
                  Chế độ Bảo trì (Maintenance Mode)
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    formData?.maintenanceMode 
                      ? 'bg-[#ffdad6] text-[#93000a] border-[#ffb59f]' 
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${formData?.maintenanceMode ? 'bg-[#ba1a1a] animate-ping' : 'bg-emerald-500'}`} />
                    {formData?.maintenanceMode ? 'Đang bảo trì' : 'Hệ thống Hoạt động'}
                  </span>
                </h3>
                <p className="text-slate-500 text-xs md:text-sm mt-1 max-w-2xl">
                  Khi kích hoạt chế độ bảo trì, tất cả phiên kết nối của người dùng thường sẽ bị chặn. Hệ thống sẽ hiển thị màn hình thông báo nâng cấp. Chỉ tài khoản Admin mới có quyền truy cập API.
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="shrink-0 relative inline-flex items-center mt-4 md:mt-0">
              <button
                onClick={() => handleChange("maintenanceMode", !formData?.maintenanceMode)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData?.maintenanceMode ? "bg-[#ba1a1a]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData?.maintenanceMode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 2 Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Column 1: API & Auth Configuration */}
          <div className="space-y-6">
            
            {/* API Integrations */}
            <div className="bg-white rounded-2xl border border-[#c7c4d7]/40 shadow-sm overflow-hidden relative">
              <div className="h-[3px] w-full bg-[#1000a3] absolute top-0 left-0"></div>
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-[#0b1c30] flex items-center gap-2 text-base">
                  <Settings2 className="w-5 h-5 text-[#1000a3]" />
                  Tích hợp Dịch vụ API
                </h3>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Mailer */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-[#0b1c30] flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      Hệ thống Gửi Email (SendGrid)
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">Kích hoạt gửi thư xác nhận tài khoản và nhắc nhở ôn tập học tập.</p>
                  </div>
                  <button
                    onClick={() => handleChange("mailerActive", !formData?.mailerActive)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData?.mailerActive ? "bg-[#1000a3]" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData?.mailerActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="w-full h-px bg-slate-100" />

                {/* Cloudinary */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-[#0b1c30] flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-slate-400" />
                      Lưu trữ Ảnh (Cloudinary Media)
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">Kích hoạt upload ảnh bìa bộ từ vựng và minh họa từ lên máy chủ CDN.</p>
                  </div>
                  <button
                    onClick={() => handleChange("cloudinaryActive", !formData?.cloudinaryActive)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData?.cloudinaryActive ? "bg-[#1000a3]" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData?.cloudinaryActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Authentication Policy */}
            <div className="bg-white rounded-2xl border border-[#c7c4d7]/40 shadow-sm overflow-hidden relative">
              <div className="h-[3px] w-full bg-[#8127cf] absolute top-0 left-0"></div>
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-[#0b1c30] flex items-center gap-2 text-base">
                  <ShieldCheck className="w-5 h-5 text-[#8127cf]" />
                  Chính sách Bảo mật & Xác thực
                </h3>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {/* Select OTP */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Độ dài mã OTP</label>
                    <select
                      value={formData?.otpLength}
                      onChange={(e) => handleChange("otpLength", Number(e.target.value))}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#1000a3]"
                    >
                      <option value="4">4 số (Ngắn)</option>
                      <option value="6">6 số (Khuyên dùng)</option>
                      <option value="8">8 số (Bảo mật cao)</option>
                    </select>
                  </div>

                  {/* Select Token Expiry */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Thời hạn Access Token</label>
                    <select
                      value={formData?.sessionExpiry}
                      onChange={(e) => handleChange("sessionExpiry", e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#1000a3]"
                    >
                      <option value="1h">1 giờ</option>
                      <option value="4h">4 giờ</option>
                      <option value="12h">12 giờ</option>
                      <option value="24h">24 giờ (Khuyên dùng)</option>
                      <option value="7d">7 ngày</option>
                    </select>
                  </div>
                </div>

                {/* Checkbox Admin MFA */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50 flex gap-3">
                  <input
                    type="checkbox"
                    id="enforceMfaAdmin"
                    checked={formData?.enforceMfaAdmin}
                    onChange={(e) => handleChange("enforceMfaAdmin", e.target.checked)}
                    className="w-4 h-4 text-[#1000a3] bg-white border-slate-300 rounded focus:ring-[#1000a3] focus:ring-2 cursor-pointer mt-0.5"
                  />
                  <label htmlFor="enforceMfaAdmin" className="cursor-pointer">
                    <span className="text-sm font-semibold text-[#0b1c30] block">Cưỡng chế xác thực MFA cho Admin</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">Yêu cầu bảo mật cấp cao đối với tất cả các thao tác liên quan tới quản trị viên.</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: SRS Settings & Auto Moderation Schedule */}
          <div className="space-y-6">
            
            {/* SRS Engine Parameters */}
            <div className="bg-white rounded-2xl border border-[#c7c4d7]/40 shadow-sm overflow-hidden relative">
              <div className="h-[3px] w-full bg-[#ff9675] absolute top-0 left-0"></div>
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-[#0b1c30] flex items-center gap-2 text-base">
                  <Sliders className="w-5 h-5 text-[#ff9675]" />
                  Tham số Thuật toán SRS
                </h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Slider 1: Global Retention Target */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-semibold text-[#0b1c30]">Mục tiêu Ghi nhớ (Global Retention Target)</span>
                    <strong className="text-lg font-extrabold text-[#1000a3]">{formData?.srsGlobalRetentionTarget}%</strong>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Xác suất mong muốn người học nhớ từ khi ôn tập. Tăng giá trị này sẽ khiến lịch trình ôn tập dày hơn.
                  </p>
                  <div className="pt-2">
                    <input 
                      type="range" 
                      min="70" 
                      max="95" 
                      value={formData?.srsGlobalRetentionTarget}
                      onChange={(e) => handleChange("srsGlobalRetentionTarget", Number(e.target.value))}
                      className="w-full h-1.5 bg-[#e1e0ff] rounded-lg appearance-none cursor-pointer accent-[#1000a3]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                      <span>70% (Lỏng lẻo)</span>
                      <span>95% (Nghiêm ngặt)</span>
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-100" />

                {/* Slider 2: Initial Interval */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-semibold text-[#0b1c30]">Khoảng ôn tập ban đầu (Initial Interval)</span>
                    <strong className="text-lg font-extrabold text-[#1000a3]">{formData?.srsInitialInterval} giờ</strong>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Khoảng thời gian chờ cơ bản trước đợt ôn tập đầu tiên sau khi học xong từ mới.
                  </p>
                  <div className="pt-2">
                    <input 
                      type="range" 
                      min="4" 
                      max="48" 
                      step="4"
                      value={formData?.srsInitialInterval}
                      onChange={(e) => handleChange("srsInitialInterval", Number(e.target.value))}
                      className="w-full h-1.5 bg-[#e1e0ff] rounded-lg appearance-none cursor-pointer accent-[#1000a3]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                      <span>4 giờ</span>
                      <span>24 giờ (Mặc định)</span>
                      <span>48 giờ</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Auto Moderation Cycle */}
            <div className="bg-white rounded-2xl border border-[#c7c4d7]/40 shadow-sm overflow-hidden relative">
              <div className="h-[3px] w-full bg-[#2c2abc] absolute top-0 left-0"></div>
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-[#0b1c30] flex items-center gap-2 text-base">
                  <Brain className="w-5 h-5 text-[#2c2abc]" />
                  Chính sách Kiểm duyệt Tự động (AI)
                </h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Moderation Interval Hours */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-semibold text-[#0b1c30]">Chu kỳ chạy kiểm duyệt AI</span>
                    <strong className="text-lg font-extrabold text-[#1000a3]">{formData?.moderationInterval} giờ / lần</strong>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Hệ thống sẽ gom batch tất cả các bộ từ công khai pending và quét AI định kỳ mỗi X giờ.
                  </p>
                  <div className="pt-2">
                    <input 
                      type="range" 
                      min="1" 
                      max="24" 
                      value={formData?.moderationInterval}
                      onChange={(e) => handleChange("moderationInterval", Number(e.target.value))}
                      className="w-full h-1.5 bg-[#e1e0ff] rounded-lg appearance-none cursor-pointer accent-[#1000a3]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                      <span>1 giờ</span>
                      <span>3 giờ (Khuyên dùng)</span>
                      <span>24 giờ</span>
                    </div>
                  </div>
                </div>

                {/* Info warning */}
                <div className="p-4 bg-blue-50/50 border border-blue-200/50 rounded-xl flex gap-3 text-xs text-blue-800">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                  <p className="leading-relaxed">
                    Thay đổi chu kỳ sẽ lập tức lên lịch lại background worker BullMQ của hệ thống ở chế độ thời gian thực.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Moderation Prompt Guidelines Card */}
        <div className="bg-white rounded-2xl border border-[#c7c4d7]/40 shadow-sm overflow-hidden relative">
          <div className="h-[3px] w-full bg-[#1000a3] absolute top-0 left-0"></div>
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-[#0b1c30] flex items-center gap-2 text-base">
              <Brain className="w-5 h-5 text-[#1000a3]" />
              Nguyên tắc chỉ dẫn kiểm duyệt AI (System Prompt Guidelines)
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-slate-500 text-xs leading-relaxed">
              Nhập các chỉ thị nghiêm ngặt để ép Gemini API kiểm duyệt. Nội dung này sẽ được chèn trực tiếp vào prompt hệ thống của AI để đảm bảo tiêu chuẩn an toàn cho cộng đồng học tiếng Anh.
            </p>
            <textarea
              value={formData?.aiModerationGuidelines}
              onChange={(e) => handleChange("aiModerationGuidelines", e.target.value)}
              rows={6}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1000a3] focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
