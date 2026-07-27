import React, { useState, useEffect } from "react";
import { 
  getDashboardStats, 
  getDailyStats, 
  getHeatmapStats,
  DashboardStats,
  DailyStat,
  HeatmapStat
} from "../../api/stats.api";
import toast from "react-hot-toast";

export default function Statistics() {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"today" | "7days" | "30days" | "all">("30days");
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; val: number; date: string } | null>(null);

  useEffect(() => {
    loadStatistics();
  }, [timeRange]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const daysParam = timeRange === "today" ? 1 : timeRange === "7days" ? 7 : timeRange === "30days" ? 30 : undefined;
      const dailyDaysParam = timeRange === "today" ? 1 : timeRange === "7days" ? 7 : timeRange === "30days" ? 30 : 3650;
      const [dashRes, dailyRes, heatmapRes] = await Promise.all([
        getDashboardStats(daysParam),
        getDailyStats(dailyDaysParam),
        getHeatmapStats()
      ]);

      if (dashRes.data?.success) {
        setDashboardData(dashRes.data.data);
      }
      if (dailyRes.data?.success) {
        setDailyStats(dailyRes.data.data || []);
      }
      if (heatmapRes.data?.success) {
        setHeatmapData(heatmapRes.data.data || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load learning statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading learning statistics…</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center p-8 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-md mx-auto text-center flex-col gap-4 my-12">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-2xl">error</span>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Failed to load statistics</h3>
          <p className="text-slate-500 text-sm mt-1">Please make sure the backend server is running and try again.</p>
        </div>
        <button 
          onClick={loadStatistics}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer mx-auto"
        >
          Retry
        </button>
      </div>
    );
  }

  // Format study time spent (e.g. 42h 15m)
  const formatTimeSpent = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  // Generate Vocabulary Growth points
  const maxVal = Math.max(...dailyStats.map(d => d.newWordsLearned + d.wordsReviewed), 10);
  const linePoints = dailyStats.map((d, idx) => {
    const x = dailyStats.length > 1 ? (idx / (dailyStats.length - 1)) * 100 : 50;
    const val = d.newWordsLearned + d.wordsReviewed;
    const y = 100 - (val / maxVal) * 70 - 15; // keep margins [15, 85]
    return { x, y, val, date: d.date };
  });

  const linePath = linePoints.length > 0 
    ? linePoints.map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
    : "";
  
  const areaPath = linePath ? `${linePath} L100,100 L0,100 Z` : "";

  // Process Heatmap Data (52 weeks = 364 days — full year, auto-fills card width)
  const heatmapDaysCount = 364;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - heatmapDaysCount + 1);

  const dateList: Array<{ dateStr: string; count: number }> = [];
  const heatmapMap = new Map<string, number>();
  heatmapData.forEach(h => {
    if (h.date) {
      heatmapMap.set(h.date.substring(0, 10), h.count);
    }
  });

  for (let i = 0; i < heatmapDaysCount; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dStr = d.toISOString().substring(0, 10);
    dateList.push({
      dateStr: dStr,
      count: heatmapMap.get(dStr) || 0
    });
  }

  const weeks: Array<Array<{ dateStr: string; count: number }>> = [];
  for (let i = 0; i < dateList.length; i += 7) {
    weeks.push(dateList.slice(i, i + 7));
  }

  // Export CSV Report simple helper
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,New Words,Words Reviewed,Accuracy %,Time Spent (sec)\n";
    
    dailyStats.forEach(d => {
      csvContent += `${d.date},${d.newWordsLearned},${d.wordsReviewed},${d.accuracy},${d.timeSpent}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MinLish_Learning_Report_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Report exported successfully!");
  };

  return (
    <div className="space-y-8 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight font-display mb-1">
            Statistics Overview
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Track your learning progress and vocabulary mastery.
          </p>
        </div>
      </div>

      {/* Filter and Export Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200">
            <button 
              onClick={() => setTimeRange("today")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                timeRange === "today" 
                  ? "bg-purple-600 text-white shadow-md shadow-purple-100" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Today
            </button>
            <button 
              onClick={() => setTimeRange("7days")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                timeRange === "7days" 
                  ? "bg-purple-600 text-white shadow-md shadow-purple-100" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Last 7 Days
            </button>
            <button 
              onClick={() => setTimeRange("30days")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                timeRange === "30days" 
                  ? "bg-purple-600 text-white shadow-md shadow-purple-100" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Last 30 Days
            </button>
            <button 
              onClick={() => setTimeRange("all")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                timeRange === "all" 
                  ? "bg-purple-600 text-white shadow-md shadow-purple-100" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All Time
            </button>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              calendar_today
            </span>
            <div className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 min-w-48 select-none">
              {timeRange === "today" ? "Today's statistics" : 
               timeRange === "7days" ? "Last 7 learning days" : 
               timeRange === "30days" ? "Last 30 learning days" :
               "All-time statistics"}
            </div>
          </div>


        </div>

        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#efecf8] hover:bg-[#e9e6f3] text-purple-700 font-bold text-xs rounded-2xl transition-all border border-purple-100 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          Export Report
        </button>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Words Mastered */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
              <span className="material-symbols-outlined text-2xl">psychology</span>
            </div>
            {dashboardData.todayStats.newLearned > 0 && (
              <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-bold text-xs">
                <span className="material-symbols-outlined text-[14px]">trending_up</span> +{dashboardData.todayStats.newLearned} today
              </span>
            )}
          </div>
          <div className="relative z-10 mt-auto">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Words Mastered</p>
            <h3 className="text-3xl font-extrabold text-slate-800 leading-none">
              {dashboardData.masteredWords}
            </h3>
          </div>
        </div>

        {/* Metric 2: Learning Streak */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
              <span className="material-symbols-outlined text-2xl">local_fire_department</span>
            </div>
            <span className="text-amber-600 font-bold text-xs bg-amber-50 px-2.5 py-1 rounded-full">
              Keep it burning!
            </span>
          </div>
          <div className="relative z-10 mt-auto">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Learning Streak</p>
            <h3 className="text-3xl font-extrabold text-slate-800 leading-none">
              {dashboardData.streak.current} Days
            </h3>
          </div>
        </div>

        {/* Metric 3: Study Time */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-500">
              <span className="material-symbols-outlined text-2xl">schedule</span>
            </div>
            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-bold text-xs">
              Longest: {dashboardData.streak.longest}d
            </span>
          </div>
          <div className="relative z-10 mt-auto">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Study Time</p>
            <h3 className="text-3xl font-extrabold text-slate-800 leading-none">
              {formatTimeSpent(dashboardData.timeSpent.totalSeconds)}
            </h3>
          </div>
        </div>

        {/* Metric 4: Level Estimate */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group border-l-4 border-l-rose-500">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-rose-50 rounded-xl text-rose-500">
              <span className="material-symbols-outlined text-2xl">diamond</span>
            </div>
            <span className="text-slate-500 font-bold text-xs bg-slate-50 px-2.5 py-1 rounded-full">
              Confidence: {dashboardData.currentLevel.confidence}%
            </span>
          </div>
          <div className="relative z-10 mt-auto">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Estimated Level</p>
            <h3 className="text-3xl font-extrabold text-rose-500 leading-none">
              CEFR - {dashboardData.currentLevel.estimated || "A2"}
            </h3>
          </div>
        </div>
      </div>

      {/* Charts Row: Vocabulary Activity + Accuracy Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vocabulary Activity — 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-[400px] overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Vocabulary Activity</h3>
              <p className="text-xs text-slate-400">Total words (new + reviewed) learned over time</p>
            </div>
          </div>
          
          {dailyStats.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              No daily stats data available for this range.
            </div>
          ) : (
            <div className="flex-1 relative w-full flex flex-col mt-2">
              <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[10px] text-slate-400 font-bold z-10">
                <span>{maxVal}</span>
                <span>{Math.round(maxVal * 0.75)}</span>
                <span>{Math.round(maxVal * 0.5)}</span>
                <span>{Math.round(maxVal * 0.25)}</span>
                <span>0</span>
              </div>
              
              <div className="absolute left-8 right-0 top-1 bottom-8 flex flex-col justify-between pointer-events-none z-0">
                <div className="w-full border-t border-slate-100 border-dashed"></div>
                <div className="w-full border-t border-slate-100 border-dashed"></div>
                <div className="w-full border-t border-slate-100 border-dashed"></div>
                <div className="w-full border-t border-slate-100 border-dashed"></div>
                <div className="w-full border-t border-slate-200"></div>
              </div>
              
              <div className="absolute inset-0 left-8 bottom-8 overflow-visible z-10">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#4648d4" stopOpacity="0.25"></stop>
                      <stop offset="100%" stopColor="#4648d4" stopOpacity="0"></stop>
                    </linearGradient>
                  </defs>
                  {areaPath && <path d={areaPath} fill="url(#chartGrad)"></path>}
                  {linePath && <path d={linePath} fill="none" stroke="#4648d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"></path>}
                </svg>

                {linePoints.map((pt, idx) => (
                  <div
                    key={idx}
                    className="absolute w-3 h-3 -translate-x-1.5 -translate-y-1.5 rounded-full bg-white border-2 border-purple-600 cursor-pointer hover:scale-150 transition-all z-20"
                    style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}

                {hoveredPoint && (
                  <div 
                    className="absolute bg-slate-900 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-xl transform -translate-x-1/2 -translate-y-full z-30 pointer-events-none transition-all duration-150"
                    style={{ left: `${hoveredPoint.x}%`, top: `${hoveredPoint.y - 4}%` }}
                  >
                    <div>{hoveredPoint.val} Words</div>
                    <div className="text-[8px] text-slate-400">{new Date(hoveredPoint.date).toLocaleDateString()}</div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-slate-900 rotate-45"></div>
                  </div>
                )}
              </div>

              <div className="absolute left-8 right-0 bottom-0 flex justify-between text-[10px] text-slate-400 font-bold px-1 z-10 select-none">
                <span>{dailyStats[0]?.date ? new Date(dailyStats[0].date).toLocaleDateString("en-US", {month:"short", day:"numeric"}) : "Start"}</span>
                <span>{dailyStats[Math.floor(dailyStats.length/2)]?.date ? new Date(dailyStats[Math.floor(dailyStats.length/2)].date).toLocaleDateString("en-US", {month:"short", day:"numeric"}) : "Mid"}</span>
                <span>{dailyStats[dailyStats.length-1]?.date ? new Date(dailyStats[dailyStats.length-1].date).toLocaleDateString("en-US", {month:"short", day:"numeric"}) : "End"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Accuracy Rate — 1/3 width */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-1">Accuracy Rate</h3>
          <p className="text-xs text-slate-400 mb-6">Overall performance in SRS study reviews</p>
          
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="relative w-44 h-44">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
                <path className="text-purple-600" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${dashboardData.overallAccuracy}, 100`} strokeLinecap="round" strokeWidth="3.5"></path>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold text-slate-800 leading-none">{dashboardData.overallAccuracy}%</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2">Excellent</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>
                <span className="text-slate-500">Mastery Target</span>
              </div>
              <span className="text-slate-800">90%</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                <span className="text-slate-500">Words Learned</span>
              </div>
              <span className="text-slate-800">{dashboardData.totalWordsLearned} words</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Activity Heatmap — Full Width at bottom */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-0.5">Daily Activity</h3>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold select-none">
            <span>Less</span>
            {["bg-slate-100 border border-slate-200", "bg-purple-100", "bg-purple-300", "bg-purple-500", "bg-purple-700"].map((cls, i) => (
              <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${cls}`}></div>
            ))}
            <span>More</span>
          </div>
        </div>

        {/* Month Labels */}
        <div className="relative h-4 mb-1 select-none" style={{ marginLeft: 28 }}>
          {(() => {
            const monthLabels: { label: string; weekIndex: number }[] = [];
            let lastMonth = -1;
            weeks.forEach((week, weekIdx) => {
              const d = new Date(week[0].dateStr);
              const m = d.getMonth();
              if (m !== lastMonth) {
                monthLabels.push({ label: d.toLocaleDateString("en-US", { month: "short" }), weekIndex: weekIdx });
                lastMonth = m;
              }
            });
            return monthLabels.map((ml, i) => (
              <span
                key={i}
                className="absolute text-[10px] font-medium text-slate-400"
                style={{ left: `${(ml.weekIndex / weeks.length) * 100}%` }}
              >
                {ml.label}
              </span>
            ));
          })()}
        </div>

        {/* Heatmap Grid — CSS Grid auto-fills width */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `24px repeat(${weeks.length}, 1fr)`,
            gap: 3,
          }}
        >
          {/* Day-of-week labels (column 1, rows 1-7) */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, i) => (
            <div
              key={`label-${i}`}
              className="flex items-center"
              style={{ gridColumn: 1, gridRow: i + 1 }}
            >
              <span className="text-[9px] font-medium text-slate-300">
                {i % 2 === 1 ? label : ""}
              </span>
            </div>
          ))}

          {/* Contribution cells (columns 2+, rows 1-7) */}
          {weeks.flatMap((week, weekIdx) =>
            week.map((day, dayIdx) => {
              const count = day.count;
              let bg = "bg-slate-100";
              if (count > 20) bg = "bg-purple-700";
              else if (count > 10) bg = "bg-purple-500";
              else if (count > 5) bg = "bg-purple-300";
              else if (count > 0) bg = "bg-purple-100";

              return (
                <div
                  key={day.dateStr}
                  className={`aspect-square rounded-[2px] ${bg} cursor-pointer transition-colors duration-100 relative group/tile`}
                  style={{ gridColumn: weekIdx + 2, gridRow: dayIdx + 1 }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 -translate-y-1 bg-slate-800 text-white text-[9px] font-semibold py-1 px-2 rounded-md shadow-lg opacity-0 pointer-events-none group-hover/tile:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {count > 0 ? `${count} reviews` : "No activity"} · {new Date(day.dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-[2px] border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span className="text-xs font-semibold text-slate-500">
                {heatmapData.filter(h => h.count > 0).length} active days
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-xs font-semibold text-slate-500">
                {dashboardData.streak.current} day streak
              </span>
            </div>
          </div>
          <span className="text-[10px] text-slate-300 font-medium">Last 12 months</span>
        </div>
      </div>
    </div>
  );
}
