export interface NotificationItem {
  _id: string;
  userId: string;
  type: "daily_reminder" | "review_due" | "streak_milestone" | "achievement" | "system" | "report" | "ai_moderation";
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

export interface GetNotificationsResponse {
  data: NotificationItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}
