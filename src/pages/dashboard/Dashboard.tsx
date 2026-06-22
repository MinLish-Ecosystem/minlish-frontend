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
import { useEffect } from "react";
import { EmptyState } from "../../components/common";

const StatCard = ({ label, value, trend, icon: Icon, color }: any) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"
  >
    <div>
      <p className="text-sm font-semibold text-slate-400 mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      {trend && (
        <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${trend.startsWith('+') ? 'text-emerald-500' : 'text-orange-500'}`}>
          {trend.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
          {trend} this week
        </p>
      )}
      {!trend && (
        <p className="text-xs font-bold mt-2 flex items-center gap-1 text-emerald-500">
           <CheckCircle2 className="w-3 h-3" /> Daily goal met
        </p>
      )}
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

  useEffect(() => {
    dispatch(fetchVocabSets({}));
  }, [dispatch]);

  // Navigate to flashcard session for the most recently updated set
  const handleResumeLesson = () => {
    if (sets.length > 0) {
      navigate(`/learn/${sets[0].id}`);
    } else {
      navigate("/vocabulary");
    }
  };

  const handleStartReview = () => {
    if (sets.length > 0) {
      navigate(`/learn/${sets[0].id}`);
    } else {
      navigate("/vocabulary");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Welcome Banner */}
      <section className="relative w-full h-60 rounded-4xl overflow-hidden shadow-2xl shadow-purple-200">
        <div className="absolute inset-0 bg-linear-to-r from-[#667eea] to-[#764ba2]" />
        
        {/* Blob Decor */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-black/10 rounded-full blur-3xl" />

        <div className="relative h-full flex flex-col justify-center px-12 z-10">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl font-bold text-white mb-4"
          >
            Welcome back, {user?.name.split(' ')[0]}!
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-purple-100 text-lg max-w-xl mb-8"
          >
            You're making great progress. Keep up the momentum and reach your daily goals.
          </motion.p>
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onClick={handleResumeLesson}
            className="w-fit bg-white text-purple-600 px-8 py-4 rounded-full font-bold shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <History className="w-5 h-5" />
            Resume Last Lesson
          </motion.button>
        </div>
      </section>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="New Words Learned" 
          value="24" 
          trend="+12%" 
          icon={PlusCircle} 
          color="bg-cyan-50 text-cyan-500" 
        />
        <StatCard 
          label="Words Reviewed" 
          value="186" 
          icon={History} 
          color="bg-emerald-50 text-emerald-500" 
        />
        <StatCard 
          label="Current Streak" 
          value="14 Days" 
          trend="Keep it burning!" 
          icon={Flame} 
          color="bg-orange-50 text-orange-500" 
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
                     mastery={0}
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
          <div className="bg-linear-to-br from-slate-50 to-purple-50 border border-purple-100 rounded-4xl p-8 shadow-sm relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-200/30 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-purple-600 mb-6">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Daily Review</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">
                You have <span className="text-purple-600 font-bold text-lg mx-1">42</span> words due for Spaced Repetition review today.
              </p>
              <button
                onClick={handleStartReview}
                className="w-full bg-[#4648d4] text-white py-4 rounded-2xl font-bold shadow-xl shadow-purple-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Start Review
                <ArrowRight className="w-5 h-5" />
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
