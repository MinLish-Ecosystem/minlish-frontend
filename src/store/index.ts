import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import vocabReducer from './slices/vocabSlice';
import notificationReducer from './slices/notificationSlice';
import listeningReducer from './slices/listeningSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    vocab: vocabReducer,
    notification: notificationReducer,
    listening: listeningReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

