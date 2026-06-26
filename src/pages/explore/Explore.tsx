import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Flame, ArrowLeft, ArrowRight, Copy, Users, Star, Plus, Check } from "lucide-react";
import toast from "react-hot-toast";

import ExploreHero from "../../components/features/explore/ExploreHero";
import TrendingSetCard from "../../components/features/explore/TrendingSetCard";
import { fetchPublicSets, clonePublicSet, fetchVocabSets } from "../../store/slices/vocabSlice";
import type { RootState } from "../../store";
import { getErrorMessage } from "../../lib/formErrors";
import Loading from "../../components/common/Loading";

const FALLBACK_SLIDES = [
  {
    id: "fb1",
    name: "IELTS Academic Masterclass",
    description: "Master the most frequently tested vocabulary for the IELTS Academic exam. Includes contextual examples, synonyms, and pronunciation guides.",
    coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop",
    category: "IELTS",
    level: "Advanced",
    colorTheme: "purple",
    totalWords: 500,
    learnerCount: 12400
  },
  {
    id: "fb2",
    name: "Travel Survival English",
    description: "Essential phrases for airports, hotels, and exploring new cities confidently.",
    coverUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000&auto=format&fit=crop",
    category: "Travel",
    level: "Intermediate",
    colorTheme: "blue",
    totalWords: 150,
    learnerCount: 8900
  }
];

const getFallbackImage = (category: string, index: number) => {
  const images: Record<string, string> = {
    IELTS: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop",
    Business: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop",
    Travel: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000&auto=format&fit=crop",
    Technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop",
    Academic: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000&auto=format&fit=crop",
  };
  return images[category] || [
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000&auto=format&fit=crop",
  ][index % 3];
};

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

export default function Explore() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { publicSets, publicSetsLoading, sets } = useSelector((state: RootState) => state.vocab);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    dispatch(fetchPublicSets({ sortBy: "popular", limit: 12 }) as any);
    dispatch(fetchVocabSets({}) as any);
  }, [dispatch]);

  const slidesToUse = publicSets.length > 0 ? publicSets.slice(0, 5) : FALLBACK_SLIDES;

  useEffect(() => {
    if (isHovered || slidesToUse.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slidesToUse.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isHovered, slidesToUse.length]);

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + slidesToUse.length) % slidesToUse.length);
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % slidesToUse.length);
  };

  const handleCloneSet = async (setId: string) => {
    const toastId = toast.loading("Adding set to your library...");
    try {
      await dispatch(clonePublicSet(setId) as any).unwrap();
      toast.success("Added to library successfully!", { id: toastId });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to add set"), { id: toastId });
    }
  };

  if (publicSetsLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto space-y-12 pb-12">
      {/* Page Header & Main Discovery Search */}
      <ExploreHero />

      {/* Featured Slider */}
      <section className="pt-4">
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-slate-800">Featured Collections</h3>
          <p className="text-sm text-slate-500 mt-1">Handpicked collections to help you learn faster.</p>
        </div>

        <div 
          className="relative h-[350px] w-full rounded-2xl overflow-hidden shadow-md border border-slate-200 group bg-slate-900"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Slides Flex Wrapper */}
          <div 
            className="flex h-full w-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slidesToUse.map((set, idx) => {
              const bgImg = set.coverUrl || getFallbackImage(set.category, idx);
              return (
                <div 
                  key={set.id}
                  onClick={() => navigate(`/explore/${set.id}`)}
                  className="w-full h-full flex-shrink-0 relative cursor-pointer"
                >
                  {/* Background Cover Image with Zoom Effect */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-102"
                    style={{ backgroundImage: `url('${bgImg}')` }}
                  />

                  {/* Sleek Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-transparent" />

                  {/* Slide Content */}
                  <div className="absolute inset-0 flex flex-col justify-center px-12 md:px-20 text-white z-10 select-none">
                    <div className="flex items-center gap-2.5 mb-4">
                      <span className="bg-amber-500 text-white px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                        Popular
                      </span>
                      <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs flex items-center gap-1 font-semibold border border-white/10">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {set.category} • {set.level}
                      </span>
                    </div>

                    <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-3 max-w-xl leading-tight">
                      {set.name}
                    </h3>
                    <p className="text-base text-slate-200 max-w-xl mb-6 line-clamp-2 leading-relaxed">
                      {set.description || "No description provided."}
                    </p>

                    <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-300">
                      <span className="flex items-center gap-2">
                        <Copy className="w-4 h-4 text-purple-400" /> {set.totalWords} Cards
                      </span>
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400" /> {set.learnerCount.toLocaleString()} Learners
                      </span>
                      {sets.some(s => s.clonedFrom === set.id) ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/vocabulary');
                          }}
                          className="mt-2 md:mt-0 flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all hover:scale-105 shadow-md shadow-emerald-900/30 cursor-pointer"
                        >
                          <Check className="w-4 h-4" /> In Library
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloneSet(set.id);
                          }}
                          className="mt-2 md:mt-0 flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-all hover:scale-105 shadow-md shadow-purple-900/30 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Add to Library
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Arrows */}
          {slidesToUse.length > 1 && (
            <>
              <button 
                onClick={handlePrevSlide}
                className="absolute left-6 top-1/2 -translate-y-1/2 bg-slate-900/40 hover:bg-slate-900/70 text-white p-2.5 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm z-20 border border-white/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={handleNextSlide}
                className="absolute right-6 top-1/2 -translate-y-1/2 bg-slate-900/40 hover:bg-slate-900/70 text-white p-2.5 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm z-20 border border-white/10"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {slidesToUse.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {slidesToUse.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all duration-300 ${
                    idx === currentSlide ? "bg-purple-500 w-7 shadow-sm" : "bg-white/50 hover:bg-white"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Horizontal Scroll Section: Trending Now */}
      <section className="pt-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Flame className="w-6 h-6 text-amber-500 fill-amber-500" />
              Trending Now
            </h3>
            <p className="text-sm text-slate-500 mt-1">Most popular sets among learners this week.</p>
          </div>
          <Link to="/explore/all" className="text-sm font-semibold text-purple-600 hover:underline">
            View All
          </Link>
        </div>
        
        <div className="flex overflow-x-auto hide-scrollbar gap-6 pb-6 snap-x">
          {publicSets.length > 0 ? (
            publicSets.map((set) => {
              const isAdded = sets.some(s => s.clonedFrom === set.id);
              return (
                <TrendingSetCard
                  key={set.id}
                  title={set.name}
                  description={set.description || ""}
                  tags={set.tags || []}
                  termsCount={set.totalWords}
                  topBorderColorClass={getBorderColor(set.colorTheme)}
                  isAdded={isAdded}
                  onClick={() => navigate(`/explore/${set.id}`)}
                  onAdd={() => handleCloneSet(set.id)}
                />
              );
            })
          ) : (
            <p className="text-sm text-slate-500">No trending sets available.</p>
          )}
        </div>
      </section>
    </div>
  );
}
