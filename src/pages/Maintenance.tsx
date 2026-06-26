import { Settings, Sparkles, HelpCircle } from "lucide-react";

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-[#fcf8ff] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Decorative background blurs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#8127cf]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#1000a3]/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="relative max-w-lg w-full bg-white/70 backdrop-blur-xl border border-slate-200/50 p-8 md:p-12 rounded-3xl shadow-[0px_20px_50px_rgba(129,39,207,0.08)] flex flex-col items-center text-center">
        {/* Animated Icon Container */}
        <div className="relative mb-8 w-24 h-24 flex items-center justify-center">
          {/* Pulsing ring */}
          <div className="absolute inset-0 bg-[#8127cf]/10 rounded-full animate-ping duration-1000" />
          
          <div className="w-20 h-20 bg-gradient-to-br from-[#8127cf] to-[#1000a3] rounded-2xl flex items-center justify-center shadow-lg relative z-10">
            <Settings className="w-10 h-10 text-white animate-spin [animation-duration:15s]" />
          </div>
          
          <Sparkles className="w-5 h-5 text-amber-500 absolute top-0 right-0 animate-bounce" />
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#1000a3] to-[#8127cf] bg-clip-text text-transparent mb-4">
          Hệ thống đang bảo trì
        </h1>
        
        {/* Message */}
        <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-8">
          MinLish đang nâng cấp máy chủ để mang đến cho bạn những trải nghiệm học tập và ôn luyện từ vựng tuyệt vời hơn. 
          Quá trình này dự kiến sẽ hoàn thành sớm. Rất mong bạn thông cảm cho sự bất tiện này!
        </p>

        {/* Info Box */}
        <div className="w-full bg-[#f8f9ff] border border-[#e1e0ff] rounded-2xl p-4 flex gap-3 text-left mb-8">
          <HelpCircle className="w-5 h-5 text-[#1000a3] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-[#1000a3] uppercase tracking-wide">Bạn cần hỗ trợ?</h4>
            <p className="text-xs text-slate-500 mt-1">
              Nếu bạn gặp lỗi ngoài dự kiến, vui lòng liên hệ ban quản trị tại <a href="mailto:support@minlish.com" className="text-[#8127cf] font-semibold hover:underline">support@minlish.com</a>.
            </p>
          </div>
        </div>
        
        {/* Brand Footer */}
        <div className="flex items-center gap-2 mt-2">
          <div className="w-6 h-6 rounded-md bg-[#2c2abc] flex items-center justify-center text-white text-xs font-bold font-heading">
            M
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">MinLish Aurora</span>
        </div>
      </div>
    </div>
  );
}
