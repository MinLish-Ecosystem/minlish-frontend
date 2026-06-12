import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────

export type VocabCategory = 'General' | 'Business' | 'IELTS' | 'TOEIC' | 'Travel' | 'Technology' | 'Academic' | 'Psychology' | 'Science' | 'Other';
export type VocabLevel    = 'Beginner' | 'Intermediate' | 'Advanced' | 'Academic';
export type ColorTheme    = 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'cyan';
export type WordStatus    = 'new' | 'learning' | 'review' | 'mastered';
export type SortBy        = 'newest' | 'oldest' | 'popular' | 'alphabetical';

export interface VocabSet {
  id: string;
  name: string;
  description?: string;
  category: VocabCategory;
  level: VocabLevel;
  colorTheme: ColorTheme;
  tags: string[];
  isPublic: boolean;
  totalWords: number;
  learnerCount: number;
  clonedFrom?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Word {
  id: string;
  setId: string;
  word: string;
  pronunciation?: string;
  partOfSpeech?: string;
  meaning: string;
  descriptionEN?: string;
  examples: string[];
  synonyms: string[];
  antonyms: string[];
  collocations: string[];
  note?: string;
  imageUrl?: string;
  audioUrl?: string;
  status?: WordStatus;
}

export interface VocabFilters {
  q?: string;
  category?: VocabCategory;
  level?: VocabLevel;
  tags?: string[];
  sortBy?: SortBy;
  page?: number;
  limit?: number;
  includeProgress?: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── State ──────────────────────────────────────────────────────────────────

interface VocabState {
  // My Library
  sets: VocabSet[];
  setsLoading: boolean;
  setsPagination: Pagination | null;

  // Current Set Detail
  currentSet: VocabSet | null;
  currentSetWords: Word[];
  currentSetLoading: boolean;

  // Explore — Public Sets
  publicSets: VocabSet[];
  publicSetsLoading: boolean;
  publicSetsPagination: Pagination | null;

  // Shared
  filters: VocabFilters;
  error: string | null;

  // Legacy (keep for backward-compat with Dashboard)
  sets_legacy: any[];
  loading: boolean;
}

const initialState: VocabState = {
  sets: [],
  setsLoading: false,
  setsPagination: null,

  currentSet: null,
  currentSetWords: [],
  currentSetLoading: false,

  publicSets: [],
  publicSetsLoading: false,
  publicSetsPagination: null,

  filters: {},
  error: null,

  // Legacy
  sets_legacy: [],
  loading: false,
};

// ─── Async Thunks ────────────────────────────────────────────────────────────

/** Fetch My Library với filter + search + pagination */
export const fetchVocabSets = createAsyncThunk(
  'vocab/fetchSets',
  async (filters: VocabFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.q)        params.set('q', filters.q);
    if (filters.category) params.set('category', filters.category);
    if (filters.level)    params.set('level', filters.level);
    if (filters.sortBy)   params.set('sortBy', filters.sortBy);
    if (filters.tags?.length) params.set('tags', filters.tags.join(','));
    if (filters.page)     params.set('page', String(filters.page));
    if (filters.limit)    params.set('limit', String(filters.limit));
    if (filters.includeProgress !== undefined) params.set('includeProgress', String(filters.includeProgress));

    const response = await api.get(`/api/v1/vocab/sets?${params}`);
    return response.data.data;
  }
);

/** Fetch Public Sets cho Explore */
export const fetchPublicSets = createAsyncThunk(
  'vocab/fetchPublicSets',
  async (filters: VocabFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.q)        params.set('q', filters.q);
    if (filters.category) params.set('category', filters.category);
    if (filters.level)    params.set('level', filters.level);
    if (filters.sortBy)   params.set('sortBy', filters.sortBy);
    if (filters.tags?.length) params.set('tags', filters.tags.join(','));
    if (filters.page)     params.set('page', String(filters.page));
    if (filters.limit)    params.set('limit', String(filters.limit));

    const response = await api.get(`/api/v1/vocab/sets/public?${params}`);
    return response.data.data;
  }
);

/** Fetch chi tiết một Set và danh sách Words của nó */
export const fetchSetDetail = createAsyncThunk(
  'vocab/fetchSetDetail',
  async (setId: string) => {
    const [setRes, wordsRes] = await Promise.all([
      api.get(`/api/v1/vocab/sets/${setId}`),
      api.get(`/api/v1/vocab/sets/${setId}/words`),
    ]);
    return { set: setRes.data.data, words: wordsRes.data.data };
  }
);

/**
 * Clone public set về My Library (nút "+" ở Explore)
 * TODO (Người 2): Kết nối với UI sau khi backend sẵn sàng
 */
export const clonePublicSet = createAsyncThunk(
  'vocab/clonePublicSet',
  async (setId: string) => {
    const response = await api.post(`/api/v1/vocab/sets/${setId}/clone`);
    return response.data.data as VocabSet;
  }
);

/**
 * Tạo bộ từ mới
 * TODO (Người 2): Kết nối với CreateSetModal khi modal được xây dựng
 */
export const createSet = createAsyncThunk(
  'vocab/createSet',
  async (data: Partial<VocabSet>) => {
    const response = await api.post('/api/v1/vocab/sets', data);
    return response.data.data as VocabSet;
  }
);

/**
 * Xóa bộ từ
 * TODO (Người 2): Kết nối với nút Delete trong VocabSetCard
 */
export const deleteSet = createAsyncThunk(
  'vocab/deleteSet',
  async (setId: string) => {
    await api.delete(`/api/v1/vocab/sets/${setId}`);
    return setId;
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const vocabSlice = createSlice({
  name: 'vocab',
  initialState,
  reducers: {
    /** Cập nhật filter state khi user thay đổi bộ lọc */
    setFilters(state, action: PayloadAction<VocabFilters>) {
      state.filters = action.payload;
    },
    /** Reset filter về mặc định */
    clearFilters(state) {
      state.filters = {};
    },
    /** Clear current set khi rời khỏi trang detail */
    clearCurrentSet(state) {
      state.currentSet = null;
      state.currentSetWords = [];
    },
  },
  extraReducers: (builder) => {
    // ── My Library ──
    builder
      .addCase(fetchVocabSets.pending, (state) => {
        state.setsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVocabSets.fulfilled, (state, action) => {
        state.setsLoading = false;
        state.loading = false;
        state.sets = action.payload.data ?? [];
        state.setsPagination = action.payload.pagination ?? null;
        // Legacy support
        state.sets_legacy = action.payload.data ?? [];
      })
      .addCase(fetchVocabSets.rejected, (state, action) => {
        state.setsLoading = false;
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch sets';
      });

    // ── Public Sets (Explore) ──
    builder
      .addCase(fetchPublicSets.pending, (state) => {
        state.publicSetsLoading = true;
      })
      .addCase(fetchPublicSets.fulfilled, (state, action) => {
        state.publicSetsLoading = false;
        state.publicSets = action.payload.data ?? [];
        state.publicSetsPagination = action.payload.pagination ?? null;
      })
      .addCase(fetchPublicSets.rejected, (state, action) => {
        state.publicSetsLoading = false;
        state.error = action.error.message ?? 'Failed to fetch public sets';
      });

    // ── Set Detail ──
    builder
      .addCase(fetchSetDetail.pending, (state) => {
        state.currentSetLoading = true;
      })
      .addCase(fetchSetDetail.fulfilled, (state, action) => {
        state.currentSetLoading = false;
        state.currentSet = action.payload.set;
        state.currentSetWords = action.payload.words;
      })
      .addCase(fetchSetDetail.rejected, (state, action) => {
        state.currentSetLoading = false;
        state.error = action.error.message ?? 'Failed to fetch set detail';
      });

    // ── Clone Public Set ──
    builder
      .addCase(clonePublicSet.fulfilled, (state, action) => {
        state.sets.unshift(action.payload);
      });

    // ── Create Set ──
    builder
      .addCase(createSet.fulfilled, (state, action) => {
        state.sets.unshift(action.payload);
      });

    // ── Delete Set ──
    builder
      .addCase(deleteSet.fulfilled, (state, action) => {
        state.sets = state.sets.filter(s => s.id !== action.payload);
      });
  },
});

export const { setFilters, clearFilters, clearCurrentSet } = vocabSlice.actions;
export default vocabSlice.reducer;
