import React from "react";
import { Search } from "lucide-react";

export default function ExploreHero() {
  return (
    <section className="flex flex-col gap-6 items-center text-center max-w-2xl mx-auto pt-6">
      <h2 className="text-5xl font-bold text-slate-800">
        Discover new worlds of <span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">vocabulary</span>
      </h2>
      <p className="text-lg text-slate-500">
        Explore curated sets, trending collections, and community favorites to accelerate your learning journey.
      </p>
      
      <div className="w-full relative mt-4 shadow-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
        <input 
          type="text" 
          placeholder="Search for IELTS, Travel, Business..." 
          className="w-full pl-12 pr-32 py-4 bg-white border border-slate-200 rounded-full text-lg focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all"
        />
        <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#4648d4] text-white px-6 py-2 rounded-full text-sm font-bold hover:scale-105 transition-transform">
          Search
        </button>
      </div>
    </section>
  );
}
