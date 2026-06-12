import { create } from "zustand";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from "../services/api";

interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  loaded: boolean;
  refresh: () => Promise<void>;
  refreshCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,
  loading: false,
  loaded: false,

  refresh: async () => {
    set({ loading: true });
    const res = await fetchNotifications(1, 20);
    const items = res?.data?.items || [];
    const unreadCount = items.filter((n) => !n.isRead).length;
    set({ items, unreadCount, loading: false, loaded: true });
  },

  refreshCount: async () => {
    const res = await fetchUnreadCount();
    set({ unreadCount: res?.data?.unreadCount ?? 0 });
  },

  markRead: async (id: string) => {
    const before = get().items;
    set({
      items: before.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, get().unreadCount - 1),
    });
    await markNotificationRead(id);
  },

  markAllRead: async () => {
    set({
      items: get().items.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    });
    await markAllNotificationsRead();
  },

  reset: () => set({ items: [], unreadCount: 0, loaded: false }),
}));
