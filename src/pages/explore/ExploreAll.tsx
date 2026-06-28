import React, { useEffect, useCallback, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Search, SlidersHorizontal } from "lucide-react";
import TrendingSetCard from "../../components/features/explore/TrendingSetCard";
import { VocabCategory, VocabLevel, SortBy, fetchPublicSets, clonePublicSet, fetchVocabSets } from "../../store/slices/vocabSlice";
import type { RootState } from "../../store";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

const getBorderColor = (theme: string) => {
  const colors: Record<string, string> = {
    blue: "border-blue-500",
    emerald: "border-emerald-500",
    amber: "border-amber-500",
    purple: "border-purple-600",
    rose: "border-rose-500",
    cyan: "border-cyan-500",
  };
  return colors[theme] || "border-purple-600";
};

const CATEGORIES: VocabCategory[] = ["General", "Business", "IELTS", "TOEIC", "Travel", "Technology", "Academic", "Psychology", "Science"];
const LEVELS: VocabLevel[]        = ["Beginner", "Intermediate", "Advanced", "Academic"];
const SORTS: { value: SortBy; label: string }[] = [
  { value: "popular",     label: "Most Popular" },
  { value: "newest",      label: "Newest" },
  { value: "alphabetical", label: "A → Z" },
];

export default function ExploreAll() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { publicSets, publicSetsLoading, publicSetsPagination, sets } = useSelector((state: RootState) => state.vocab);

  const initialQ = searchParams.get("q") || "";

  const [searchText, setSearchText] = useState(initialQ);
  const [q,        setQ]        = useState(initialQ);
  const [category, setCategory] = useState<VocabCategory | "">("");
  const [level,    setLevel]    = useState<VocabLevel | "">("");
  const [sortBy,   setSortBy]   = useState<SortBy>("popular");
  const [ownerFilter, setOwnerFilter] = useState<"all" | "mine" | "others">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchVocabSets({}) as any);
  }, [dispatch]);

  const handleCloneSet = async (setId: string) => {
    const toastId = toast.loading("Adding set to your library...");
    try {
      await dispatch(clonePublicSet(setId) as any).unwrap();
      toast.success("Added to library successfully!", { id: toastId });
    } catch (error: any) {
      toast.error(error.message || "Failed to add set", { id: toastId });
    }
  };

  // Debounce search text updates to update "q" and reset page
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(searchText);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

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

  const filteredSets = publicSets.filter((set) => {
    if (ownerFilter === "mine") return set.userId === user?.id;
    if (ownerFilter === "others") return set.userId !== user?.id;
    return true;
  });

  return (
    <div className="max-w-[1280px] mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Explore All Sets</h2>
        <p className="text-slate-500">Find the perfect vocabulary set for your learning goals.</p>
        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-lg p-2.5 max-w-fit">
          <span className="text-purple-500 font-bold">💡 Smart Search:</span>
          <span>Finds sets using partial matching (case-insensitive) on name, description, and tags.</span>
        </p>
      </div>

      {/* Search Input and Filter Button Row */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search sets by name, description, tags..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all text-sm outline-none"
          />
        </div>

        {/* Inline Filters */}
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as VocabCategory | "");
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none bg-white cursor-pointer min-w-[140px]"
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
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none bg-white cursor-pointer min-w-[120px]"
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
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none bg-white cursor-pointer min-w-[130px]"
            >
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>

            <select
              value={ownerFilter}
              onChange={(e) => {
                setOwnerFilter(e.target.value as "all" | "mine" | "others");
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none bg-white cursor-pointer min-w-[120px]"
            >
              <option value="all">All Owners</option>
              <option value="mine">My Sets</option>
              <option value="others">Other Users</option>
            </select>

            {(category || level || sortBy !== "popular" || ownerFilter !== "all") && (
              <button
                onClick={() => {
                  setCategory("");
                  setLevel("");
                  setSortBy("popular");
                  setOwnerFilter("all");
                  setCurrentPage(1);
                }}
                className="text-xs text-slate-400 hover:text-red-500 font-bold transition-colors cursor-pointer whitespace-nowrap px-1 py-1"
              >
                Reset
              </button>
            )}
          </div>
        )}

        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg border-2 border-purple-500 font-semibold text-sm transition-all cursor-pointer w-full md:w-auto justify-center ${
            showFilters 
              ? "bg-purple-600 border-purple-600 text-white shadow-md" 
              : "text-purple-600 hover:bg-purple-50"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
        </button>
      </div>

      {!publicSetsLoading && (
        <p className="text-sm text-slate-500 mb-4 font-medium">
          Showing <span className="text-purple-600 font-bold">{filteredSets.length}</span> of <span className="text-purple-600 font-bold">{publicSetsPagination?.total || 0}</span> sets
        </p>
      )}

      {publicSetsLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loading />
        </div>
      ) : null}

      {!publicSetsLoading && filteredSets.length === 0 ? (
        <div className="col-span-full py-16 text-center">
          <EmptyState title="No sets found" description="Try adjusting your search filters." />
          <button
            onClick={() => {
              setSearchText("");
              setQ("");
              setCategory("");
              setLevel("");
              setSortBy("popular");
              setOwnerFilter("all");
              setCurrentPage(1);
            }}
            className="mt-4 text-purple-600 font-semibold hover:underline text-sm cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : null}

      {!publicSetsLoading && filteredSets.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredSets.map((set) => {
              const isOwner = Boolean(user?.id && set.userId === user.id);
              const isAdded = !isOwner && sets.some(s => s.clonedFrom === set.id);
              return (
                <TrendingSetCard
                  key={set.id}
                  title={set.name}
                  description={set.description || ""}
                  tags={set.tags || []}
                  termsCount={set.totalWords}
                  topBorderColorClass={getBorderColor(set.colorTheme)}
                  isAdded={isAdded}
                  isOwner={isOwner}
                  className="w-full"
                  onClick={() => navigate(`/explore/${set.id}`)}
                  onAdd={() => handleCloneSet(set.id)}
                />
              );
            })}
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
