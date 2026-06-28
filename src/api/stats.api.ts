import api from '../lib/api';
import { ApiResponse } from '../types/api';

export interface DashboardStats {
  streak: {
    current: number;
    longest: number;
  };
  totalWordsLearned: number;
  masteredWords: number;
  totalReviews: number;
  overallAccuracy: number;
  timeSpent: {
    totalSeconds: number;
    totalHours: number;
  };
  currentLevel: {
    estimated: string;
    confidence: number;
  };
  todayStats: {
    newLearned: number;
    reviewed: number;
    accuracy: number;
    dueCount: number;
  };
}

export interface DailyStat {
  date: string;
  newWordsLearned: number;
  wordsReviewed: number;
  correctAnswers: number;
  totalAnswers: number;
  accuracy: number;
  timeSpent: number; // seconds
}

export interface HeatmapStat {
  date: string;
  count: number;
}

export const getDashboardStats = (days?: number) => {
  return api.get<ApiResponse<DashboardStats>>('/api/v1/stats/dashboard', {
    params: days ? { days } : {}
  });
};

export const getDailyStats = (days: number = 30) => {
  return api.get<ApiResponse<DailyStat[]>>('/api/v1/stats/daily', {
    params: { days }
  });
};

export const getHeatmapStats = () => {
  return api.get<ApiResponse<HeatmapStat[]>>('/api/v1/stats/heatmap');
};
