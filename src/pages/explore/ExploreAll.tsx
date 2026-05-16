import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Plus } from "lucide-react";
import VocabSetCard from "../../components/features/vocabulary/VocabSetCard";
import { VocabCategory, VocabLevel, SortBy } from "../../store/slices/vocabSlice";

// ─── Mock data cho UI Demo ──────────────────────────────────────────────────
// TODO (Người 2): Thay bằng useDispatch/useSelector để fetch từ Redux (fetchPublicSets)

const MOCK_PUBLIC_SETS = [
  { id: "p1", name: "IELTS Academic Masterclass", wordsCount: 500, category: "IELTS", level: "Academic", mastery: 0, colorTheme: "blue" as const, learnerCount: 12400 },
  { id: "p2", name: "Travel Survival English",    wordsCount: 150, category: "Travel", level: "Beginner", mastery: 0, colorTheme: "emerald" as const, learnerCount: 8300 },
  { id: "p3", name: "Daily Idioms",               wordsCount: 200, category: "General", level: "Intermediate", mastery: 0, colorTheme: "amber" as const, learnerCount: 5600 },
  { id: "p4", name: "TOEIC 900+ Core",            wordsCount: 850, category: "TOEIC", level: "Advanced", mastery: 0, colorTheme: "purple" as const, learnerCount: 9200 },
  { id: "p5", name: "Tech Startup Jargon",        wordsCount: 120, category: "Technology", level: "Intermediate", mastery: 0, colorTheme: "cyan" as const, learnerCount: 4100 },
  { id: "p6", name: "Emotional Intelligence",     wordsCount: 200, category: "Psychology", level: "Advanced", mastery: 0, colorTheme: "rose" as const, learnerCount: 3800 },
  { id: "p7", name: "Academic Phrasal Verbs",     wordsCount: 350, category: "Academic", level: "Academic", mastery: 0, colorTheme: "blue" as const, learnerCount: 6700 },
  { id: "p8", name: "Business Negotiations",      wordsCount: 180, category: "Business", level: "Advanced", mastery: 0, colorTheme: "emerald" as const, learnerCount: 7100 },
];

const CATEGORIES: VocabCategory[] = ["General", "Business", "IELTS", "TOEIC", "Travel", "Technology", "Academic", "Psychology", "Science"];
const LEVELS: VocabLevel[]        = ["Beginner", "Intermediate", "Advanced", "Academic"];
const SORTS: { value: SortBy; label: string }[] = [
  { value: "popular",     label: "Most Popular" },
  { value: "newest",      label: "Newest" },
  { value: "alphabetical", label: "A → Z" },
];

export default function ExploreAll() {
  const navigate = useNavigate();

  // ── Local filter state ──────────────────────────────────────────────────
  // TODO (Người 2): Nâng cấp thành Redux filter state (dispatch setFilters + fetchPublicSets)
  const [q,        setQ]        = React.useState("");
  const [category, setCategory] = React.useState<VocabCategory | "">("");
  const [level,    setLevel]    = React.useState<VocabLevel | "">("");
  const [sortBy,   setSortBy]   = React.useState<SortBy>("popular");

  // Client-side filter on mock data (sẽ xóa khi có real API)
  const filtered = MOCK_PUBLIC_SETS.filter((s) => {
    const matchQ    = !q || s.name.toLowerCase().includes(q.toLowerCase());
    const matchCat  = !category || s.category === category;
    const matchLvl  = !level    || s.level    === level;
    return matchQ && matchCat && matchLvl;
  });

  return (
    <div className="max-w-[1280px] mx-auto pb-12">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Explore All Sets</h2>
        <p className="text-slate-500">Find the perfect vocabulary set for your learning goals.</p>
      </div>

      {/* Search + Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-8 flex flex-col md:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sets..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all text-sm outline-none"
          />
        </div>

        {/* Category filter */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as VocabCategory | "")}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Level filter */}
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as VocabLevel | "")}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none"
        >
          <option value="">All Levels</option>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>

        {/* Sort by */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none"
        >
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-purple-500 text-purple-600 font-semibold text-sm hover:bg-purple-50 transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500 mb-4 font-medium">
        Showing <span className="text-purple-600 font-bold">{filtered.length}</span> sets
      </p>

      {/* Sets Grid — Tái sử dụng VocabSetCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <p className="text-slate-400 text-lg">No sets found matching your filters.</p>
            <button onClick={() => { setQ(""); setCategory(""); setLevel(""); }} className="mt-4 text-purple-600 font-semibold hover:underline text-sm">
              Clear all filters
            </button>
          </div>
        ) : (
          filtered.map((set) => (
            <VocabSetCard
              key={set.id}
              id={set.id}
              name={set.name}
              wordsCount={set.wordsCount}
              category={set.category}
              level={set.level}
              mastery={set.mastery}
              colorTheme={set.colorTheme}
              onClick={() => navigate(`/explore/${set.id}`)}
            />
          ))
        )}
      </div>

      {/* TODO (Người 2): Thêm Pagination component khi có real API */}
    </div>
  );
}
