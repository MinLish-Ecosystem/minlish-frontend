import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronRight, Brain, CheckCircle, Hourglass, Users, BookCopy, Plus, Check } from "lucide-react";
import WordCard, { WordStatus } from "../../components/features/vocabulary/WordCard";

// ─── Mock Data ──────────────────────────────────────────────────────────────
// TODO (Người 2): Thay bằng useDispatch(fetchSetDetail) và useSelector(state.vocab.currentSet)

const MOCK_PUBLIC_SET = {
  id: "p3",
  name: "Daily Idioms",
  description: "Speak like a native by mastering common conversational idioms used in everyday English.",
  category: "General",
  level: "Intermediate",
  totalWords: 200,
  learnerCount: 5600,
  isPublic: true,
};

const MOCK_WORDS = [
  { id: "w1", term: "Break the ice",    pronunciation: "/breɪk ðə aɪs/",      definition: "To do or say something to relieve tension or get conversation going in an awkward social situation.", status: "New"      as WordStatus },
  { id: "w2", term: "Hit the sack",     pronunciation: "/hɪt ðə sæk/",        definition: "To go to bed, especially late at night.",                                                              status: "Learning"  as WordStatus },
  { id: "w3", term: "Bite the bullet",  pronunciation: "/baɪt ðə ˈbʊlɪt/",    definition: "To endure a painful or difficult situation that is unavoidable.",                                       status: "Mastered"  as WordStatus },
  { id: "w4", term: "Spill the beans",  pronunciation: "/spɪl ðə biːnz/",      definition: "To reveal secret information, usually accidentally.",                                                  status: "New"      as WordStatus },
  { id: "w5", term: "Piece of cake",    pronunciation: "/piːs əv keɪk/",       definition: "Something that is very easy to do.",                                                                   status: "Mastered"  as WordStatus },
  { id: "w6", term: "Under the weather",pronunciation: "/ˈʌndər ðə ˈwɛðər/",  definition: "Feeling ill or unwell.",                                                                               status: "Learning"  as WordStatus },
];

export default function ExploreSetDetail() {
  const { setId } = useParams();
  const navigate  = useNavigate();

  // TODO (Người 2): Thay bằng Redux state
  const set   = MOCK_PUBLIC_SET;
  const words = MOCK_WORDS;

  // Track clone state — TODO: Thay bằng Redux action clonePublicSet
  const [cloned, setCloned] = React.useState(false);
  const [cloning, setCloning] = React.useState(false);

  const handleClone = async () => {
    setCloning(true);
    // TODO (Người 2): dispatch(clonePublicSet(setId)) và handle success/error với toast
    await new Promise((r) => setTimeout(r, 800)); // Simulate API
    setCloned(true);
    setCloning(false);
  };

  const masteredCount = words.filter((w) => w.status === "Mastered").length;
  const learningCount = words.filter((w) => w.status === "Learning").length;

  return (
    <div className="max-w-[1280px] mx-auto pb-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-slate-500 mb-6 text-sm font-semibold flex-wrap gap-1">
        <Link to="/explore" className="hover:text-purple-600 transition-colors">Explore</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/explore/all" className="hover:text-purple-600 transition-colors">All Sets</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-800">{set.name}</span>
      </nav>

      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between border border-slate-200">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-purple-50 text-purple-600 border border-purple-200">
              {set.category}
            </span>
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-slate-50 text-slate-600 border border-slate-200">
              {set.level}
            </span>
          </div>

          <h2 className="text-3xl font-bold text-slate-800 mb-2">{set.name}</h2>
          <p className="text-base text-slate-500 mb-4 md:mb-0 max-w-xl">{set.description}</p>

          <div className="flex items-center gap-5 mt-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Brain className="text-cyan-500 w-5 h-5" />
              <span className="text-sm font-semibold text-slate-800">{set.totalWords} Words</span>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-2">
              <CheckCircle className="text-emerald-500 w-5 h-5" />
              <span className="text-sm font-semibold text-slate-800">{masteredCount} Mastered</span>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-2">
              <Hourglass className="text-amber-500 w-5 h-5" />
              <span className="text-sm font-semibold text-slate-800">{learningCount} Learning</span>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-2">
              <Users className="text-slate-400 w-5 h-5" />
              <span className="text-sm font-semibold text-slate-800">{set.learnerCount.toLocaleString()} Learners</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 md:mt-0 flex gap-3 flex-shrink-0">
          {cloned ? (
            <button
              onClick={() => navigate('/vocabulary')}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Go to My Set
            </button>
          ) : (
            <button
              onClick={handleClone}
              disabled={cloning}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02] flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              {cloning ? "Adding..." : "Add to My Library"}
            </button>
          )}
        </div>
      </div>

      {/* Word Cards Grid — Tái sử dụng WordCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {words.map((word) => (
          <WordCard
            key={word.id}
            term={word.term}
            pronunciation={word.pronunciation}
            definition={word.definition}
            status={word.status}
          />
        ))}
      </div>
    </div>
  );
}
