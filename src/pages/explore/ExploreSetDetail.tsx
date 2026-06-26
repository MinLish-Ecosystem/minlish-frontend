import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ChevronRight, Brain, CheckCircle, Hourglass, Users, Plus, Check } from "lucide-react";
import WordCard, { WordStatus } from "../../components/features/vocabulary/WordCard";
import { fetchSetDetail, clearCurrentSet, clonePublicSet, fetchVocabSets } from "../../store/slices/vocabSlice";
import type { RootState } from "../../store";
import Loading from "../../components/common/Loading";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../lib/formErrors";

export default function ExploreSetDetail() {
  const { setId } = useParams();
  const navigate  = useNavigate();
  const dispatch = useDispatch();
  const { currentSet, currentSetWords, currentSetLoading, sets } = useSelector((state: RootState) => state.vocab);

  const [cloning, setCloning] = useState(false);
  const [cloned, setCloned] = useState(false);

  useEffect(() => {
    if (setId) {
      dispatch(fetchSetDetail(setId) as any);
    }
    dispatch(fetchVocabSets({}) as any);

    return () => {
      dispatch(clearCurrentSet());
    };
  }, [setId, dispatch]);

  const isAlreadyCloned = sets.some(s => s.clonedFrom === setId);

  const handleClone = async () => {
    if (!setId) return;

    const toastId = toast.loading("Adding set to your library...");
    setCloning(true);
    try {
      await dispatch(clonePublicSet(setId) as any).unwrap();
      toast.success("Added to library successfully!", { id: toastId });
      setCloned(true);
    } catch (error) {
      console.error("Failed to clone set:", error);
      toast.error(getErrorMessage(error, "Failed to add set to your library"), { id: toastId });
    } finally {
      setCloning(false);
    }
  };

  if (currentSetLoading) {
    return (
      <div className="max-w-[1280px] mx-auto pb-12 flex justify-center items-center py-16">
        <Loading />
      </div>
    );
  }

  if (!currentSet) {
    return (
      <div className="max-w-[1280px] mx-auto pb-12">
        <div className="py-16 text-center">
          <p className="text-slate-400 text-lg">Set not found.</p>
          <button onClick={() => navigate("/explore/all")} className="mt-4 text-purple-600 font-semibold hover:underline">
            Back to All Sets
          </button>
        </div>
      </div>
    );
  }

  const masteredCount = currentSetWords.filter((w) => w.status === "mastered").length;
  const learningCount = currentSetWords.filter((w) => w.status === "learning").length;

  const formatWordStatus = (status?: string): WordStatus => {
    if (!status) return "New";
    return (status.charAt(0).toUpperCase() + status.slice(1)) as WordStatus;
  };

  return (
    <div className="max-w-[1280px] mx-auto pb-12">
      <nav className="flex items-center text-slate-500 mb-6 text-sm font-semibold flex-wrap gap-1">
        <Link to="/explore" className="hover:text-purple-600 transition-colors">Explore</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/explore/all" className="hover:text-purple-600 transition-colors">All Sets</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-800">{currentSet.name}</span>
      </nav>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between border border-slate-200">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-purple-50 text-purple-600 border border-purple-200">
              {currentSet.category}
            </span>
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-slate-50 text-slate-600 border border-slate-200">
              {currentSet.level}
            </span>
          </div>

          <h2 className="text-3xl font-bold text-slate-800 mb-2">{currentSet.name}</h2>
          <p className="text-base text-slate-500 mb-4 md:mb-0 max-w-xl">{currentSet.description}</p>

          <div className="flex items-center gap-5 mt-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Brain className="text-cyan-500 w-5 h-5" />
              <span className="text-sm font-semibold text-slate-800">{currentSet.totalWords} Words</span>
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
              <span className="text-sm font-semibold text-slate-800">{currentSet.learnerCount.toLocaleString()} Learners</span>
            </div>
          </div>
        </div>

        <div className="mt-6 md:mt-0 flex gap-3 flex-shrink-0">
          {isAlreadyCloned || cloned ? (
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentSetWords.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <p className="text-slate-400 text-lg">No words in this set yet.</p>
          </div>
        ) : (
          currentSetWords.map((word) => (
            <WordCard
              key={word.id}
              term={word.word}
              pronunciation={word.pronunciation || ""}
              definition={word.meaning || ""}
              status={formatWordStatus(word.status)}
            />
          ))
        )}
      </div>
    </div>
  );
}
