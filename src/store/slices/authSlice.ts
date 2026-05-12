import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types/user';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
}

const savedUser = localStorage.getItem('minlish_user');
const savedToken = localStorage.getItem('minlish_token');
const savedRefreshToken = localStorage.getItem('minlish_refresh_token');

const initialState: AuthState = {
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken || null,
  refreshToken: savedRefreshToken || null,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('minlish_user', JSON.stringify(action.payload.user));
      localStorage.setItem('minlish_token', action.payload.accessToken);
      localStorage.setItem('minlish_refresh_token', action.payload.refreshToken);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      localStorage.removeItem('minlish_user');
      localStorage.removeItem('minlish_token');
      localStorage.removeItem('minlish_refresh_token');
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('minlish_user', JSON.stringify(state.user));
      }
    },
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
