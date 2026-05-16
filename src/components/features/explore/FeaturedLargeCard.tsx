import React from "react";
import { Star, Copy, Users } from "lucide-react";

export interface FeaturedLargeCardProps {
  title: string;
  description: string;
  bgImageUrl: string;
  rating: number;
  cardsCount: number;
  learnersCount: string;
  badgeText?: string;
  onClick?: () => void;
}

export default function FeaturedLargeCard({
  title,
  description,
  bgImageUrl,
  rating,
  cardsCount,
  learnersCount,
  badgeText = "Featured",
  onClick,
}: FeaturedLargeCardProps) {
  return (
    <div 
      onClick={onClick}
      className="md:col-span-2 relative rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow group cursor-pointer h-[320px] flex items-end p-8 border border-slate-200"
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
        style={{ backgroundImage: `url('${bgImageUrl}')` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 w-full transform transition-transform duration-300 group-hover:-translate-y-2">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            {badgeText}
          </span>
          <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs flex items-center gap-1 font-semibold">
            <Star className="w-3.5 h-3.5 fill-white" /> {rating}
          </span>
        </div>
        
        <h3 className="text-3xl font-bold text-white mb-2">{title}</h3>
        <p className="text-base text-slate-200 max-w-lg mb-4 line-clamp-2">
          {description}
        </p>
        
        <div className="flex items-center gap-4 text-white/80 text-xs font-semibold">
          <span className="flex items-center gap-1">
            <Copy className="w-4 h-4" /> {cardsCount} Cards
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" /> {learnersCount} Learners
          </span>
        </div>
      </div>
    </div>
  );
}
