import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

export const fetchVocabSets = createAsyncThunk('vocab/fetchSets', async () => {
  const response = await api.get('/api/v1/user/vocab-sets');
  return response.data.data;
});

interface VocabState {
  sets: any[];
  loading: boolean;
  error: string | null;
}

const initialState: VocabState = {
  sets: [],
  loading: false,
  error: null,
};

const vocabSlice = createSlice({
  name: 'vocab',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVocabSets.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVocabSets.fulfilled, (state, action) => {
        state.loading = false;
        state.sets = action.payload;
      })
      .addCase(fetchVocabSets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch sets';
      });
  },
});

export default vocabSlice.reducer;
