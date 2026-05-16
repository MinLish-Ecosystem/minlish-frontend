import React from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Brain, CheckCircle, Hourglass, Edit3, Plus } from "lucide-react";
import WordCard, { WordStatus } from "../../components/features/vocabulary/WordCard";

// Mock Data
const mockWords = [
  {
    id: "w1",
    term: "Synergy",
    pronunciation: "/ˈsɪnərdʒi/",
    definition: "The interaction or cooperation of two or more organizations, substances, or other agents to produce a combined effect greater than the sum of their separate effects.",
    status: "New" as WordStatus,
  },
  {
    id: "w2",
    term: "Leverage",
    pronunciation: "/ˈlɛvərɪdʒ/",
    definition: "Use (something) to maximum advantage.",
    status: "Learning" as WordStatus,
  },
  {
    id: "w3",
    term: "Paradigm",
    pronunciation: "/ˈpærədaɪm/",
    definition: "A typical example or pattern of something; a model.",
    status: "Mastered" as WordStatus,
  },
  {
    id: "w4",
    term: "Stakeholder",
    pronunciation: "/ˈsteɪkhoʊldər/",
    definition: "A person with an interest or concern in something, especially a business.",
    status: "New" as WordStatus,
  },
];

export default function VocabSetDetail() {
  const { setId } = useParams();

  // In a real app, we would fetch the set details based on setId from Redux or API.
  // Using static mock data for now based on the HTML mockup.
  
  return (
    <div className="max-w-[1280px] mx-auto pb-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-slate-500 mb-6 text-sm font-semibold">
        <Link to="/vocabulary" className="hover:text-purple-600 transition-colors">My Library</Link>
        <ChevronRight className="w-4 h-4 mx-1" />
        <Link to="/vocabulary" className="hover:text-purple-600 transition-colors">Sets</Link>
        <ChevronRight className="w-4 h-4 mx-1" />
        <span className="text-slate-800">Business English</span>
      </nav>

      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between border border-slate-200">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Business English</h2>
          <p className="text-base text-slate-500 mb-4 md:mb-0">
            Master essential corporate terminology and professional communication phrases.
          </p>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Brain className="text-cyan-500 w-5 h-5" />
              <span className="text-sm font-semibold text-slate-800">45 Words</span>
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-emerald-500 w-5 h-5" />
              <span className="text-sm font-semibold text-slate-800">12 Mastered</span>
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <Hourglass className="text-amber-500 w-5 h-5" />
              <span className="text-sm font-semibold text-slate-800">20 Learning</span>
            </div>
          </div>
        </div>

        <div className="mt-6 md:mt-0 flex gap-3">
          <button className="px-4 py-2 rounded-lg text-sm font-semibold text-purple-600 border-2 border-purple-500 hover:bg-purple-50 transition-colors flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Edit Set
          </button>
          <button className="px-5 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.05] hover:-translate-y-1 flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600">
            <Plus className="w-4 h-4" />
            Add Word
          </button>
        </div>
      </div>

      {/* Bento Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockWords.map((word) => (
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
