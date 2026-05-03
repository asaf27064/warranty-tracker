import { useState, useEffect } from "react";
import api from "../api/axios";
import type { Reminder } from "../types";

type NotificationReminder = Reminder & {
  product: {
    id: string;
    name: string;
    picture?: string;
    warrantyExpiry: string;
  };
};

export const useNotifications = () => {
  const [reminders, setReminders] = useState<NotificationReminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    try {
      const res = await api.get("/api/reminders");
      setReminders(res.data);
    } catch (error) {
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    await api.patch(`/api/reminders/${id}/read`);
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isRead: true } : r)),
    );
  };

  const activeNotifications = reminders.filter((r) => r.sent);
  const unreadCount = activeNotifications.filter((r) => !r.isRead).length;

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  return {
    reminders: activeNotifications,
    unreadCount,
    loading,
    markAsRead,
    fetchReminders,
  };
};
