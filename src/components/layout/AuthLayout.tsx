import { Outlet } from "react-router-dom";
import { Book } from "lucide-react";
import { motion } from "motion/react";

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Left side: Branding & Visuals */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-[#1e1b4b]">
        {/* Background Gradients (Aurora Effect) */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#4338ca] opacity-80" />
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-400/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-[100px] animate-pulse delay-700" />
        
        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Book className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">MinLish</h1>
          </motion.div>
        </div>

        <div className="relative z-10 max-w-lg mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl"
          >
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Master English with <br /> Aurora Learning.
            </h2>
            <p className="text-xl text-indigo-100 font-light leading-relaxed">
              Join thousands of learners elevating their vocabulary and fluency through an uplifting, optimized cognitive experience.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 text-indigo-200/50 text-sm font-medium">
          © 2026 MinLish • Powered by Aurora Learning
        </div>
      </div>

      {/* Right side: Auth Forms */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-24 py-12">
        <div className="max-w-md w-full mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
