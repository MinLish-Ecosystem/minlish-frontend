import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Search, SlidersHorizontal } from "lucide-react";
import VocabSetCard from "../../components/features/vocabulary/VocabSetCard";
import { VocabCategory, VocabLevel, SortBy, fetchPublicSets } from "../../store/slices/vocabSlice";
import type { RootState } from "../../store";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";

const CATEGORIES: VocabCategory[] = ["General", "Business", "IELTS", "TOEIC", "Travel", "Technology", "Academic", "Psychology", "Science"];
const LEVELS: VocabLevel[]        = ["Beginner", "Intermediate", "Advanced", "Academic"];
const SORTS: { value: SortBy; label: string }[] = [
  { value: "popular",     label: "Most Popular" },
  { value: "newest",      label: "Newest" },
  { value: "alphabetical", label: "A → Z" },
];

export default function ExploreAll() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { publicSets, publicSetsLoading, publicSetsPagination } = useSelector((state: RootState) => state.vocab);

  const [q,        setQ]        = React.useState("");
  const [category, setCategory] = React.useState<VocabCategory | "">("");
  const [level,    setLevel]    = React.useState<VocabLevel | "">("");
  const [sortBy,   setSortBy]   = React.useState<SortBy>("popular");
  const [currentPage, setCurrentPage] = React.useState(1);

  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const handleSearchChange = useCallback((value: string) => {
    setQ(value);
    setCurrentPage(1);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      // Trigger fetch after debounce
    }, 300);
  }, []);

  useEffect(() => {
    dispatch(
      fetchPublicSets({
        q: q || undefined,
        category: category as VocabCategory | undefined,
        level: level as VocabLevel | undefined,
        sortBy,
        page: currentPage,
        limit: 12,
      }) as any
    );
  }, [q, category, level, sortBy, currentPage, dispatch]);

  return (
    <div className="max-w-[1280px] mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Explore All Sets</h2>
        <p className="text-slate-500">Find the perfect vocabulary set for your learning goals.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={q}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search sets..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all text-sm outline-none"
          />
        </div>

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as VocabCategory | "");
            setCurrentPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={level}
          onChange={(e) => {
            setLevel(e.target.value as VocabLevel | "");
            setCurrentPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none"
        >
          <option value="">All Levels</option>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>

        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as SortBy);
            setCurrentPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none"
        >
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-purple-500 text-purple-600 font-semibold text-sm hover:bg-purple-50 transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
          Filter
        </button>
      </div>

      {!publicSetsLoading && (
        <p className="text-sm text-slate-500 mb-4 font-medium">
          Showing <span className="text-purple-600 font-bold">{publicSets.length}</span> of <span className="text-purple-600 font-bold">{publicSetsPagination?.total || 0}</span> sets
        </p>
      )}

      {publicSetsLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loading />
        </div>
      ) : null}

      {!publicSetsLoading && publicSets.length === 0 ? (
        <div className="col-span-full py-16 text-center">
          <EmptyState title="No sets found" description="Try adjusting your search filters." />
          <button
            onClick={() => {
              setQ("");
              setCategory("");
              setLevel("");
              setSortBy("popular");
              setCurrentPage(1);
            }}
            className="mt-4 text-purple-600 font-semibold hover:underline text-sm"
          >
            Clear all filters
          </button>
        </div>
      ) : null}

      {!publicSetsLoading && publicSets.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {publicSets.map((set) => (
              <VocabSetCard
                key={set.id}
                id={set.id}
                name={set.name}
                wordsCount={set.totalWords}
                category={set.category}
                level={set.level}
                mastery={0}
                colorTheme={set.colorTheme}
                onClick={() => navigate(`/explore/${set.id}`)}
              />
            ))}
          </div>

          {publicSetsPagination && publicSetsPagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              {Array.from({ length: publicSetsPagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg ${
                    page === currentPage
                      ? "bg-purple-600 text-white"
                      : "border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(publicSetsPagination.totalPages, currentPage + 1))}
                disabled={currentPage === publicSetsPagination.totalPages}
                className="px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
