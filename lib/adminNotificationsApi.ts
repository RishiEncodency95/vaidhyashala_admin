
export type AdminNotificationType = "DONATION" | "ENQUIRY" | "CASE" | "VOLUNTEER" | "SYSTEM_EXPIRY";

export interface AdminNotificationItem {
  _id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminNotificationsResult {
  notifications: AdminNotificationItem[];
  unreadCount: number;
}

// This project's backend has no /notifications/admin routes: answer here instead of sending requests
// that always 404. Swap these back to the api calls once the backend has the routes.
const NO_NOTIFICATIONS: AdminNotificationsResult = { notifications: [], unreadCount: 0 };

export const adminNotificationsApi = {
  list: (): Promise<AdminNotificationsResult> => Promise.resolve(NO_NOTIFICATIONS),
  markRead: (_id: string): Promise<void> => Promise.resolve(),
  markAllRead: (): Promise<void> => Promise.resolve(),
};
