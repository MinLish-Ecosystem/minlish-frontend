import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as notificationApi from '../../api/notification.api';
import { NotificationItem } from '../../types/notification';

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  },
};

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async ({ page, limit, type }: { page?: number; limit?: number; type?: string } = {}, thunkAPI) => {
    try {
      const response = await notificationApi.getNotifications(page, limit, type);
      return response.data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notification/fetchUnreadCount',
  async (_, thunkAPI) => {
    try {
      const response = await notificationApi.getUnreadCount();
      return response.data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch unread count');
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notification/markNotificationRead',
  async (id: string, thunkAPI) => {
    try {
      await notificationApi.markAsRead(id);
      return id;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  'notification/markAllNotificationsRead',
  async (_, thunkAPI) => {
    try {
      await notificationApi.markAllAsRead();
      return;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to mark all as read');
    }
  }
);

export const deleteNotificationThunk = createAsyncThunk(
  'notification/deleteNotification',
  async (id: string, thunkAPI) => {
    try {
      await notificationApi.deleteNotification(id);
      return id;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete notification');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearNotificationsState: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.pagination = { page: 1, limit: 20, total: 0, totalPages: 1 };
    },
    addReceivedNotification: (state, action: PayloadAction<any>) => {
      // Check if notification already exists to avoid duplicates
      const exists = state.notifications.some(n => n._id === action.payload._id);
      if (!exists) {
        state.notifications.unshift(action.payload);
        state.unreadCount += 1;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.notifications = action.payload.data;
          state.pagination = action.payload.pagination;
          state.unreadCount = action.payload.unreadCount;
        }
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        if (action.payload) {
          state.unreadCount = action.payload.unreadCount;
        }
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const id = action.payload;
        const index = state.notifications.findIndex((n) => n._id === id);
        if (index !== -1 && !state.notifications[index].isRead) {
          state.notifications[index].isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
        state.unreadCount = 0;
      })
      .addCase(deleteNotificationThunk.fulfilled, (state, action) => {
        const id = action.payload;
        const index = state.notifications.findIndex((n) => n._id === id);
        if (index !== -1) {
          const wasUnread = !state.notifications[index].isRead;
          state.notifications.splice(index, 1);
          if (wasUnread) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      });
  },
});

export const { clearNotificationsState, addReceivedNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
