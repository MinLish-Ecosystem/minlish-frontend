import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Flame, PlaneTakeoff } from "lucide-react";
import ExploreHero from "../../components/features/explore/ExploreHero";
import FeaturedLargeCard from "../../components/features/explore/FeaturedLargeCard";
import FeaturedSmallCard from "../../components/features/explore/FeaturedSmallCard";
import TrendingSetCard from "../../components/features/explore/TrendingSetCard";

export default function Explore() {
  const navigate = useNavigate();
  return (
    <div className="max-w-[1280px] mx-auto space-y-12 pb-12">
      {/* Page Header & Main Discovery Search */}
      <ExploreHero />

      {/* Featured Hero Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
        {/* Large Featured Card */}
        <FeaturedLargeCard
          title="IELTS Academic Masterclass"
          description="Master the most frequently tested vocabulary for the IELTS Academic exam. Includes contextual examples, synonyms, and pronunciation guides."
          bgImageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuDLHXJh1G3MbDlzkb0blFFFYvCPbdcwoifp4FqmWi90dJ_YoIgprf-1c3I4t4WN-C09WJKcg4TX4Of29kmKM1IOmX-bQt9D1OVnWIQPLN2YZJV6s0nrwZM-H1Tx6TZNkDN8OJ2S66JP8ZfHDJdovXaMl7KCFl6ALNbumvrGiu6-5Wclng7vk729JuA1BKkGl-LyfTPz78J4z4rm_WhGTaEygmCL496hVDDba6Q6wLKib7N1kvAHkXM_TWvRAI_D5hn0_yTNxWOb5T0"
          rating={4.9}
          cardsCount={500}
          learnersCount="12.4k"
          onClick={() => navigate('/explore/p1')}
        />

        {/* Secondary Featured Cards */}
        <div className="flex flex-col gap-6">
          {/* Top Small Card */}
          <FeaturedSmallCard
            title="Travel Survival English"
            description="Essential phrases for airports, hotels, and exploring new cities confidently."
            wordsCount={150}
            icon={<PlaneTakeoff className="w-4 h-4" />}
            topBorderColorClass="border-purple-600"
            onClick={() => navigate('/explore/p2')}
          />

          {/* Bottom Small Card */}
          <FeaturedSmallCard
            title="Daily Idioms"
            description="Speak like a native by mastering common conversational idioms."
            wordsCount={0} // Not used when we provide bottomContent
            badgeText="New"
            topBorderColorClass="border-cyan-500"
            bottomContent={
              <div className="flex -space-x-2">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAS6DblMiEP-W08eeN8d4G07g_isIwvuRtEoO7i5X4YflM0tzPzkZoARD9qy6xuxNsL93O7zyvhAh9C2CYZALnbynFEyfyyQnkribzxrhG3ByyObY15cQDxb6rr7JH7o3QA-hDB3R9Ml-R-8QsPSPFTOuZ7YIuRaX_fDNkPhP1jcluch15OWzqsBEEBVBElMqUMBK3q4ip0Ds9ENnWCHT79GyhcZj4YrogYkTjTcfbMKXHKytEG3SsO8u6GPhh9HFLkoTKRj9Y9Q3I" alt="User 1" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5H9Y4gvo0Rux_uoM13GV2SgetgBrgeclRCWvP4OajoOXE9r20It6wnoXR4KPIQu7jopJRB45yBV7Vxm5pVy4oHnF163mt8ObthgEJNj-qF0CKNwgJOOFNaSGDMEu72wq3HR3kwRpSil7hn2uVvhKewohujul04kLua7qJDsUgNmu0RYgtCQ3lftCclQGHaOiwS9-Ys9eIn7V0WMWT9Q9c5pI-5i5pKUxw8VwPCpaPHBoA28TtEKIsQ0g5GEPvbskcNA6-yCPcOzE" alt="User 2" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                  +2k
                </div>
              </div>
            }
          />
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
          <TrendingSetCard
            title="TOEIC 900+ Core"
            description="Business English essentials required to hit the top tier TOEIC score."
            tags={["Business", "Advanced"]}
            termsCount={850}
            topBorderColorClass="border-blue-500"
          />
          
          <TrendingSetCard
            title="Tech Startup Jargon"
            description="Navigate the modern tech workplace. From 'agile' to 'synergy'."
            tags={["Technology", "Intermediate"]}
            termsCount={120}
            topBorderColorClass="border-emerald-500"
          />
          
          <TrendingSetCard
            title="Emotional Intelligence"
            description="Vocabulary for expressing complex feelings and navigating interpersonal dynamics."
            tags={["Psychology", "Advanced"]}
            termsCount={200}
            topBorderColorClass="border-rose-500"
          />
          
          <TrendingSetCard
            title="Academic Phrasal Verbs"
            description="Elevate your academic writing with these crucial phrasal verbs."
            tags={["Academic", "Writing"]}
            termsCount={350}
            topBorderColorClass="border-purple-600"
          />
        </div>
      </section>
    </div>
  );
}
