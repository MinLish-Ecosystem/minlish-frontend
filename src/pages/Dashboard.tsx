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
  BrainCircuit
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../hooks/useAuth";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { fetchVocabSets } from "../store/slices/vocabSlice";
import { useEffect } from "react";

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
  const { sets } = useSelector((state: RootState) => state.vocab);

  useEffect(() => {
    dispatch(fetchVocabSets());
  }, [dispatch]);

  const icons: any = { Briefcase, Plane, Utensils };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Welcome Banner */}
      <section className="relative w-full h-[240px] rounded-[32px] overflow-hidden shadow-2xl shadow-purple-200">
        <div className="absolute inset-0 bg-gradient-to-r from-[#667eea] to-[#764ba2]" />
        
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
            <button className="text-purple-600 font-bold text-sm hover:underline">View All</button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {sets.map((set: any) => (
               <SetCard 
                 key={set.id}
                 {...set}
                 icon={icons[set.icon] || Briefcase}
                 color={set.id === '1' ? 'border-cyan-400' : set.id === '2' ? 'border-purple-500' : 'border-orange-400'}
               />
            ))}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Daily Review Reminder */}
          <div className="bg-gradient-to-br from-slate-50 to-purple-50 border border-purple-100 rounded-[32px] p-8 shadow-sm relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-200/30 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-purple-600 mb-6">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Daily Review</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">
                You have <span className="text-purple-600 font-bold text-lg mx-1">42</span> words due for Spaced Repetition review today.
              </p>
              <button className="w-full bg-[#4648d4] text-white py-4 rounded-2xl font-bold shadow-xl shadow-purple-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                Start Review
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Action: Create Set */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="border-2 border-dashed border-slate-200 rounded-[32px] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 hover:border-purple-300 transition-all group"
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
