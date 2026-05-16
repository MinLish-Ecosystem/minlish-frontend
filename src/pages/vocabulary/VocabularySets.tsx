import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Compass } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { fetchVocabSets } from "../../store/slices/vocabSlice";
import VocabSetCard from "../../components/features/vocabulary/VocabSetCard";
import CreateSetCard from "../../components/features/vocabulary/CreateSetCard";

export default function VocabularySets() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { sets, setsLoading: loading } = useSelector((state: RootState) => state.vocab);

  useEffect(() => {
    dispatch(fetchVocabSets({}));
  }, [dispatch]);

  // Temporary mock data for UI showcasing before backend is fully integrated
  const displaySets = Array.isArray(sets) && sets.length > 0 ? sets : [
    { id: '1', name: 'IELTS Essential 500', wordsCount: 500, category: 'IELTS', level: 'Academic', mastery: 68, colorTheme: 'blue' },
    { id: '2', name: 'Business Negotiations', wordsCount: 120, category: 'Business', level: 'Advanced', mastery: 92, colorTheme: 'emerald' },
    { id: '3', name: 'Travel Essentials', wordsCount: 85, category: 'Travel', level: 'Beginner', mastery: 15, colorTheme: 'amber' }
  ];

  return (
    <div className="max-w-[1280px] mx-auto pb-12">
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
          <button className="flex items-center gap-2 py-2.5 px-5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold hover:scale-105 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
            <Plus className="w-5 h-5" />
            Create New Set
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between border border-slate-200">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button className="whitespace-nowrap px-4 py-1.5 rounded-full bg-purple-600 text-white text-sm font-semibold shadow-sm">All Sets</button>
          <button className="whitespace-nowrap px-4 py-1.5 rounded-full bg-slate-50 text-slate-800 border border-slate-200 hover:bg-slate-100 text-sm font-semibold transition-colors">IELTS</button>
          <button className="whitespace-nowrap px-4 py-1.5 rounded-full bg-slate-50 text-slate-800 border border-slate-200 hover:bg-slate-100 text-sm font-semibold transition-colors">Business</button>
          <button className="whitespace-nowrap px-4 py-1.5 rounded-full bg-slate-50 text-slate-800 border border-slate-200 hover:bg-slate-100 text-sm font-semibold transition-colors">Travel</button>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search sets..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all text-sm outline-none"
          />
        </div>
      </div>

      {/* Sets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && (!sets || sets.length === 0) ? (
          <div className="col-span-full py-12 flex justify-center text-slate-400">Loading sets...</div>
        ) : (
          <>
            {displaySets.map((set: any) => (
              <VocabSetCard
                key={set.id}
                id={set.id}
                name={set.name}
                wordsCount={set.wordsCount || set.words || 0}
                category={set.category || 'General'}
                level={set.level || 'Intermediate'}
                mastery={set.mastery || 0}
                colorTheme={set.colorTheme || 'purple'}
                onClick={() => navigate(`/vocabulary/${set.id}`)}
              />
            ))}
            <CreateSetCard />
          </>
        )}
      </div>
    </div>
  );
}
