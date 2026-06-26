import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronRight, Brain, Plus, Edit3, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { clearCurrentSet, fetchSetDetail, type Word as VocabWord } from "../../store/slices/vocabSlice";
import WordCard, { WordStatus } from "../../components/features/vocabulary/WordCard";
import { EmptyState } from "../../components/common";
import api from "../../lib/api";
import { toast } from "react-hot-toast";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";

export default function AdminVocabSetDetail() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentSet, currentSetWords, currentSetLoading } = useSelector((state: RootState) => state.vocab);
  const [showEdit, setShowEdit] = useState(false);
  const [deletingSet, setDeletingSet] = useState(false);

  useEffect(() => {
    if (setId) {
      dispatch(fetchSetDetail(setId));
    }

    return () => {
      dispatch(clearCurrentSet());
    };
  }, [setId, dispatch]);

  const wordsCount = currentSet?.totalWords ?? currentSetWords.length;

  const { visibleItems: visibleWords, sentinelRef: wordSentinelRef, hasMore: hasMoreWords } = useInfiniteScroll(currentSetWords, 12, []);

  const handleDeleteSet = async () => {
    if (!setId) return;
    const ok = window.confirm(
      `Are you sure you want to delete "${currentSet?.name}"? This will permanently delete all ${wordsCount} words inside. This action cannot be undone.`
    );
    if (!ok) return;
    setDeletingSet(true);
    try {
      await api.delete(`/api/v1/vocab/sets/${setId}`);
      toast.success("Set deleted successfully");
      navigate("/admin/vocabulary");
    } catch {
      toast.error("Failed to delete set. Try again.");
    } finally {
      setDeletingSet(false);
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    if (!setId) return;
    const ok = window.confirm("Delete this word? This action cannot be undone.");
    if (!ok) return;

    try {
      await api.delete(`/api/v1/vocab/sets/${setId}/words/${wordId}`);
      await dispatch(fetchSetDetail(setId));
      toast.success("Word deleted");
    } catch {
      toast.error("Failed to delete word. Try again.");
    }
  };

  if (currentSetLoading || (setId && !currentSet)) {
    return <div className="max-w-7xl mx-auto pb-12 text-slate-400">Loading set...</div>;
  }

  if (!currentSet) {
    return (
      <div className="max-w-7xl mx-auto pb-12">
        <EmptyState
          title="Set not found"
          description="The requested vocabulary set could not be loaded."
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-slate-500 mb-6 text-sm font-semibold">
        <Link to="/admin/vocabulary" className="hover:text-purple-600 transition-colors">Public Library</Link>
        <ChevronRight className="w-4 h-4 mx-1" />
        <Link to="/admin/vocabulary" className="hover:text-purple-600 transition-colors">Sets</Link>
        <ChevronRight className="w-4 h-4 mx-1" />
        <span className="text-slate-800">{currentSet.name}</span>
      </nav>

      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between border border-slate-200">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">{currentSet.name}</h2>
          <p className="text-base text-slate-500 mb-4 md:mb-0">
            {currentSet.description || "Public vocabulary set on the system."}
          </p>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Brain className="text-cyan-500 w-5 h-5" />
              <span className="text-sm font-semibold text-slate-800">{wordsCount} Words</span>
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f0dbff] text-[#6900b3]">
              {currentSet.category}
            </span>
            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e5eeff] text-[#2f2dbe]">
              {currentSet.level}
            </span>
          </div>
        </div>

        <div className="mt-6 md:mt-0 flex gap-2">
          <button
            onClick={() => navigate(`/admin/vocabulary/${setId}/edit`)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-purple-600 border-2 border-purple-200 hover:bg-purple-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Edit3 className="w-4 h-4" />
            Edit Set & Words
          </button>
          <button
            onClick={handleDeleteSet}
            disabled={deletingSet}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-400 border-2 border-rose-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deletingSet ? "..." : "Delete Set"}
          </button>
        </div>
      </div>

      {/* Bento Grid List */}
      {currentSetWords.length === 0 ? (
        <EmptyState
          title="No words in this set"
          description="Click Edit Set & Words to add vocabulary to this set."
          action={
            <button
              onClick={() => navigate(`/admin/vocabulary/${setId}/edit`)}
              className="flex items-center gap-2 py-2.5 px-5 rounded-lg bg-linear-to-r from-purple-500 to-indigo-600 text-white font-semibold hover:scale-105 transition-all duration-200"
            >
              <Edit3 className="w-5 h-5" />
              Edit Set & Words
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleWords.map((word) => (
            <WordCard
              key={word.id}
              term={word.word}
              pronunciation={word.pronunciation || ""}
              definition={word.meaning}
              status="New"
              audioUrl={word.audioUrl}
              onEdit={() => navigate(`/admin/vocabulary/${setId}/edit`)}
              onDelete={() => handleDeleteWord(word.id)}
            />
          ))}
          {hasMoreWords && <div ref={wordSentinelRef} className="col-span-full h-4" />}
        </div>
      )}
    </div>
  );
}
