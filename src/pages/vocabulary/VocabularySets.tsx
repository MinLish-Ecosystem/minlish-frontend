import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Compass } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { createSet, fetchVocabSets, type ColorTheme, type VocabCategory, type VocabLevel } from "../../store/slices/vocabSlice";
import VocabSetCard from "../../components/features/vocabulary/VocabSetCard";
import { deleteSet } from "../../store/slices/vocabSlice";
import CreateSetCard from "../../components/features/vocabulary/CreateSetCard";
import { EmptyState, TextField } from "../../components/common";
import { toast } from "react-hot-toast";

export default function VocabularySets() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { sets, setsLoading: loading } = useSelector((state: RootState) => state.vocab);
  const [q, setQ] = useState("");
  const [activeCategory, setActiveCategory] = useState<VocabCategory | "">("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "General" as VocabCategory,
    level: "Intermediate" as VocabLevel,
    colorTheme: "blue" as ColorTheme,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      dispatch(
        fetchVocabSets({
          q: q.trim() || undefined,
          category: activeCategory || undefined,
        })
      );
    }, 300);

    return () => window.clearTimeout(timer);
  }, [q, activeCategory, dispatch]);

  const handleCreateSet = async () => {
    if (!form.name.trim()) {
      toast.error("Set name is required");
      return;
    }

    setCreating(true);
    try {
      const createdSet = await dispatch(
        createSet({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          category: form.category,
          level: form.level,
          colorTheme: form.colorTheme,
          isPublic: false,
          tags: [],
        })
      ).unwrap();

      toast.success("Set created!");
      setShowCreate(false);
      setForm({
        name: "",
        description: "",
        category: "General",
        level: "Intermediate",
        colorTheme: "blue",
      });
      navigate(`/vocabulary/${createdSet.id}`);
    } catch {
      toast.error("Failed to create set. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const categoryPills: Array<VocabCategory | ""> = ["", "General", "IELTS", "Business", "Travel", "Technology", "Academic", "Other"];
  const hasSets = Array.isArray(sets) && sets.length > 0;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Your Vocabulary Sets</h2>
          <p className="text-base text-slate-500 mt-1">Manage and track your learning progress across different topics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/explore')}
            className="flex items-center gap-2 py-2.5 px-4 rounded-lg border-2 border-purple-500 text-purple-600 font-semibold hover:bg-purple-50 transition-all duration-200"
          >
            <Compass className="w-5 h-5" />
            Explore More
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 py-2.5 px-5 rounded-lg bg-linear-to-r from-purple-500 to-indigo-600 text-white font-semibold hover:scale-105 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Create New Set
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between border border-slate-200">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {categoryPills.map((category) => {
            const isActive = activeCategory === category || (!category && activeCategory === "");

            return (
              <button
                key={category || "all"}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-800 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {category || "All Sets"}
              </button>
            );
          })}
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search sets..." 
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all text-sm outline-none"
          />
        </div>
      </div>

      {loading && !hasSets ? (
        <div className="py-12 flex justify-center text-slate-400">Loading sets...</div>
      ) : !hasSets ? (
        <EmptyState
          title="No sets yet"
          description="Create your first vocabulary set to start organizing words."
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 py-2.5 px-5 rounded-lg bg-linear-to-r from-purple-500 to-indigo-600 text-white font-semibold hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Create New Set
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sets.map((set) => (
            <VocabSetCard
              key={set.id}
              id={set.id}
              name={set.name}
              wordsCount={set.totalWords}
              category={set.category}
              level={set.level}
              mastery={0}
              colorTheme={set.colorTheme}
              onClick={() => navigate(`/vocabulary/${set.id}`)}
              onEditSet={() => navigate(`/vocabulary/${set.id}`)}
              onDeleteSet={async () => {
                const ok = window.confirm(`Delete set "${set.name}"? This cannot be undone.`);
                if (!ok) return;
                try {
                  await dispatch(deleteSet(set.id)).unwrap();
                  toast.success("Set deleted");
                } catch {
                  toast.error("Failed to delete set. Try again.");
                }
              }}
            />
          ))}
          <CreateSetCard onClick={() => setShowCreate(true)} />
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Create New Set</h3>
                <p className="text-sm text-slate-500 mt-1">Start a new library set for your vocabulary.</p>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
                type="button"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                id="set-name"
                label="Set Name"
                value={form.name}
                onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
                placeholder="Business Vocabulary"
                required
              />

              <div className="space-y-2">
                <label htmlFor="set-category" className="text-sm font-semibold text-slate-700">Category</label>
                <select
                  id="set-category"
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as VocabCategory }))}
                  className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all"
                >
                  {['General', 'Business', 'IELTS', 'TOEIC', 'Travel', 'Technology', 'Academic', 'Psychology', 'Science', 'Other'].map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="set-level" className="text-sm font-semibold text-slate-700">Level</label>
                <select
                  id="set-level"
                  value={form.level}
                  onChange={(e) => setForm((prev) => ({ ...prev, level: e.target.value as VocabLevel }))}
                  className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all"
                >
                  {['Beginner', 'Intermediate', 'Advanced', 'Academic'].map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="set-theme" className="text-sm font-semibold text-slate-700">Color Theme</label>
                <select
                  id="set-theme"
                  value={form.colorTheme}
                  onChange={(e) => setForm((prev) => ({ ...prev, colorTheme: e.target.value as ColorTheme }))}
                  className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all"
                >
                  {['blue', 'emerald', 'amber', 'purple', 'rose', 'cyan'].map((theme) => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label htmlFor="set-description" className="text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  id="set-description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Add a short note about this set"
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSet}
                disabled={creating}
                className="px-5 py-2 rounded-lg bg-linear-to-r from-purple-500 to-indigo-600 text-white font-semibold hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                {creating ? "Creating..." : "Create Set"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
