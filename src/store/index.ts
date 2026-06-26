import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import vocabReducer from './slices/vocabSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    vocab: vocabReducer,
    notification: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

