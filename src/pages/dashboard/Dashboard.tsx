import { 
  PlusCircle, 
  History, 
  Flame, 
  ArrowRight, 
  Briefcase, 
  Plane, 
  Utensils,
  TrendingUp,
  CheckCircle2,
  BrainCircuit,
  Compass
} from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { fetchVocabSets } from "../../store/slices/vocabSlice";
import { useEffect, useState } from "react";
import { EmptyState } from "../../components/common";
import api from "../../lib/api";

const StatCard = ({ label, value, trend, icon: Icon, color, footer }: any) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"
  >
    <div>
      <p className="text-sm font-semibold text-slate-400 mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      {trend && (
        <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${trend.startsWith('+') ? 'text-emerald-500' : 'text-slate-500'}`}>
          {trend.startsWith('+') && <TrendingUp className="w-3 h-3" />}
          {trend.startsWith('-') && <TrendingUp className="w-3 h-3 rotate-180" />}
          {trend}
        </p>
      )}
      {!trend && footer}
    </div>
    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${color}`}>
      <Icon className="w-7 h-7" />
    </div>
  </motion.div>
);

const SetCard = ({ name, description, words, mastery, level, color, icon: Icon }: any) => {
  const getLevelColor = (l: string) => {
    switch(l) {
      case 'Advanced': return 'text-purple-600 bg-purple-50';
      case 'Intermediate': return 'text-blue-600 bg-blue-50';
      case 'Beginner': return 'text-emerald-600 bg-emerald-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={`bg-white p-6 rounded-2xl shadow-sm border-t-4 ${color} border-slate-100 group cursor-pointer hover:shadow-xl transition-all`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
          <Icon className="w-6 h-6" />
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getLevelColor(level)}`}>
          {level}
        </span>
      </div>
      <h4 className="text-lg font-bold text-slate-800 mb-1">{name}</h4>
      <p className="text-sm text-slate-400 mb-6">{words} words • {description}</p>
      
      <div className="space-y-2">
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${mastery}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${color.replace('border-', 'bg-')}`} 
          />
        </div>
        <p className="text-xs font-bold text-slate-500 text-right">{mastery}% Mastered</p>
      </div>
    </motion.div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { sets, setsLoading } = useSelector((state: RootState) => state.vocab);
  const [dueSummary, setDueSummary] = useState<any>({ 
    newWordsCount: 0, 
    dueReviewsCount: 0, 
    totalDueCount: 0,
    rawNewWordsCount: 0,
    rawDueReviewsCount: 0
  });
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchVocabSets({ limit: 4, includeProgress: true }));

    const fetchDueSummary = async () => {
      try {
        const res = await api.get("/api/v1/learning/due-summary");
        if (res.data.success && res.data.data) {
          setDueSummary(res.data.data);
        }
      } catch (error) {
        console.error("Failed to load due summary on dashboard:", error);
      }
    };

    const fetchDashboardStats = async () => {
      try {
        const res = await api.get("/api/v1/stats/dashboard");
        if (res.data.success && res.data.data) {
          setStats(res.data.data);
        }
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      }
    };

    fetchDueSummary();
    fetchDashboardStats();
  }, [dispatch]);

  // Navigate to global flashcard session
  const handleResumeLesson = () => {
    if (sets.length > 0) {
      navigate("/learn/session");
    } else {
      navigate("/vocabulary");
    }
  };

  const handleStartReview = () => {
    if (sets.length > 0) {
      navigate("/learn/session");
    } else {
      navigate("/vocabulary");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Welcome Banner */}
      <section className="relative w-full h-64 rounded-3xl overflow-hidden border border-slate-200/20 shadow-xl shadow-indigo-950/10 flex flex-col justify-center">
        {/* Futuristic Background Mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950" />
        
        {/* Aurora Glowing Orbs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] animate-[pulse_6s_ease-in-out_infinite]" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] animate-[pulse_8s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-pink-500/10 rounded-full blur-[80px]" />

        <div className="relative px-10 md:px-14 z-10 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-black text-purple-300 uppercase tracking-widest border border-white/5 inline-block mb-4 shadow-inner">
              ✨ Level Up Your English
            </span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight drop-shadow-md"
          >
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-300 to-pink-300">{user?.name.split(' ')[0]}</span>!
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-300 text-base md:text-lg max-w-xl mb-6 font-medium leading-relaxed"
          >
            You're making great progress. Keep up the momentum and reach your daily goals.
          </motion.p>
          
          <motion.button 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            onClick={handleResumeLesson}
            className="w-fit bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-400 hover:to-indigo-500 px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-purple-950/20 flex items-center gap-2 hover:scale-[1.03] active:scale-[0.98] transition-all border border-purple-400/20 cursor-pointer"
          >
            <History className="w-5 h-5" />
            Resume Last Lesson
          </motion.button>
        </div>
      </section>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Words Learned" 
          value={stats ? stats.totalWordsLearned : "..."} 
          trend={stats && stats.todayStats?.newLearned > 0 ? `+${stats.todayStats.newLearned} today` : undefined} 
          icon={PlusCircle} 
          color="bg-cyan-50 text-cyan-500" 
          footer={
            stats && stats.isNewGoalMet ? (
              <p className="text-xs font-bold mt-2 flex items-center gap-1 text-emerald-500">
                <CheckCircle2 className="w-3.5 h-3.5" /> Daily goal met
              </p>
            ) : (
              <p className="text-xs font-bold mt-2 text-slate-400">
                Progress: {stats?.todayStats?.newLearned ?? 0}/{stats?.dailyGoal ?? 10} today
              </p>
            )
          }
        />
        <StatCard 
          label="Words Mastered" 
          value={stats ? stats.masteredWords : "..."} 
          trend={stats && stats.todayStats?.reviewed > 0 ? `+${stats.todayStats.reviewed} reviewed today` : undefined}
          icon={History} 
          color="bg-emerald-50 text-emerald-500" 
          footer={
            stats && stats.isReviewGoalMet ? (
              <p className="text-xs font-bold mt-2 flex items-center gap-1 text-emerald-500">
                <CheckCircle2 className="w-3.5 h-3.5" /> Daily review goal met
              </p>
            ) : (
              <p className="text-xs font-bold mt-2 text-slate-400">
                Progress: {stats?.todayStats?.reviewed ?? 0}/{stats?.reviewPerDay ?? 20} today
              </p>
            )
          }
        />
        <StatCard 
          label="Current Streak" 
          value={stats ? `${stats.streak?.current ?? 0} Days` : "..."} 
          trend={stats ? `Longest: ${stats.streak?.longest ?? 0} days` : "Keep it burning!"} 
          icon={Flame} 
          color="bg-orange-50 text-orange-500" 
          footer={
            <p className="text-xs font-bold mt-2 text-slate-400">
              Longest: {stats?.streak?.longest ?? 0} days
            </p>
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Vocabulary Sets */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-800">Your Vocabulary Sets</h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/explore')}
                className="flex items-center gap-1.5 text-sm font-semibold text-purple-600 border border-purple-300 rounded-full px-3 py-1.5 hover:bg-purple-50 transition-colors"
              >
                <Compass className="w-4 h-4" />
                Explore more
              </button>
                <button onClick={() => navigate('/vocabulary')} className="text-purple-600 font-bold text-sm hover:underline">View All</button>
            </div>
          </div>
          
            {setsLoading && sets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-slate-400">Loading sets...</div>
            ) : sets.length === 0 ? (
              <EmptyState
                title="No vocabulary sets yet"
                description="Create a set in My Library to see it on your dashboard."
                action={
                  <button
                    onClick={() => navigate('/vocabulary')}
                    className="bg-purple-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Go to My Library
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {sets.map((set: any) => (
                   <div key={set.id} onClick={() => navigate(`/vocabulary/${set.id}`)} className="cursor-pointer">
                   <SetCard 
                     name={set.name}
                     description={set.description || set.category}
                     words={set.totalWords}
                     mastery={set.progress?.masteredPct ?? 0}
                     level={set.level}
                     color={set.colorTheme === 'emerald' ? 'border-emerald-400' : set.colorTheme === 'amber' ? 'border-amber-400' : set.colorTheme === 'purple' ? 'border-purple-500' : set.colorTheme === 'rose' ? 'border-rose-400' : set.colorTheme === 'cyan' ? 'border-cyan-400' : 'border-cyan-400'}
                     icon={set.category === 'Travel' ? Plane : set.category === 'Business' ? Briefcase : Utensils}
                   />
                   </div>
                ))}
              </div>
            )}
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Daily Review Reminder */}
          <div className="bg-gradient-to-br from-slate-50 to-purple-50 border border-purple-100 rounded-4xl p-8 shadow-sm relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-200/30 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-purple-600 mb-5">
                <BrainCircuit className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-1">Lịch học hôm nay</h3>
              <p className="text-xs text-slate-400 mb-5">Theo lịch trình SRS cá nhân hoá của bạn</p>

              {/* Breakdown stats */}
              <div className="space-y-3 mb-6">
                {/* New words */}
                <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center">
                      <PlusCircle className="w-4 h-4 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Từ mới</p>
                      <p className="text-[10px] text-slate-400">Chưa từng học</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-cyan-600">{dueSummary.newWordsCount}</span>
                    {dueSummary.rawNewWordsCount > dueSummary.newWordsCount && (
                      <p className="text-[9px] text-slate-400">/ {dueSummary.rawNewWordsCount} tổng</p>
                    )}
                  </div>
                </div>

                {/* Due reviews */}
                <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                      <History className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Ôn tập</p>
                      <p className="text-[10px] text-slate-400">Đến hạn theo SRS</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-purple-600">{dueSummary.dueReviewsCount}</span>
                    {dueSummary.rawDueReviewsCount > dueSummary.dueReviewsCount && (
                      <p className="text-[9px] text-slate-400">/ {dueSummary.rawDueReviewsCount} tổng</p>
                    )}
                  </div>
                </div>

                {/* Total divider */}
                <div className="flex items-center justify-between px-1 pt-1 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-500">Tổng cần học hôm nay</span>
                  <span className={`text-lg font-extrabold ${dueSummary.totalDueCount > 0 ? 'text-[#4648d4]' : 'text-emerald-500'}`}>
                    {dueSummary.totalDueCount > 0 ? dueSummary.totalDueCount : '✓ Xong!'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleStartReview}
                disabled={dueSummary.totalDueCount === 0}
                className="w-full bg-[#4648d4] text-white py-4 rounded-2xl font-bold shadow-xl shadow-purple-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {dueSummary.totalDueCount > 0 ? (
                  <>
                    Bắt đầu ôn tập
                    <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Đã hoàn thành hôm nay!
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Action: Create Set */}
          <motion.div 
            whileHover={{ y: -4 }}
            onClick={() => navigate('/vocabulary/new')}
            className="border-2 border-dashed border-slate-200 rounded-4xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 hover:border-purple-300 transition-all group"
          >
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-purple-100 group-hover:text-purple-500 transition-all mb-4">
              <PlusCircle className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-800">Create Custom Set</h4>
            <p className="text-sm text-slate-400 mt-1">Add your own words to study</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
