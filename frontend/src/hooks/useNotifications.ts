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

export type GroupedNotification = {
  productId: string;
  product: NotificationReminder["product"];
  remindAt: string;
  isRead: boolean;
  reminderIds: string[];
};

export const useNotifications = () => {
  const [reminders, setReminders] = useState<NotificationReminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    try {
      const res = await api.get("/api/reminders");
      setReminders(res.data);
    } catch {
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const now = Date.now();
  // Only reminders that have come due (independent of email delivery).
  const due = reminders.filter(
    (r) => new Date(r.remindAt).getTime() <= now,
  );

  // One entry per product, so several fired reminders don't read as duplicates.
  const byProduct = new Map<string, GroupedNotification>();
  for (const r of due) {
    const g = byProduct.get(r.productId);
    if (g) {
      g.reminderIds.push(r.id);
      if (!r.isRead) g.isRead = false;
      if (new Date(r.remindAt).getTime() > new Date(g.remindAt).getTime()) {
        g.remindAt = r.remindAt;
      }
    } else {
      byProduct.set(r.productId, {
        productId: r.productId,
        product: r.product,
        remindAt: r.remindAt,
        isRead: r.isRead,
        reminderIds: [r.id],
      });
    }
  }
  // Most recently fired first.
  const notifications = [...byProduct.values()].sort(
    (a, b) => new Date(b.remindAt).getTime() - new Date(a.remindAt).getTime(),
  );
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markGroupRead = async (ids: string[]) => {
    setReminders((prev) =>
      prev.map((r) => (ids.includes(r.id) ? { ...r, isRead: true } : r)),
    );
    await Promise.all(
      ids.map((id) => api.patch(`/api/reminders/${id}/read`).catch(() => {})),
    );
  };

  const markAllRead = async () => {
    setReminders((prev) => prev.map((r) => ({ ...r, isRead: true })));
    await api.patch("/api/reminders/read-all").catch(() => {});
  };

  const clearAll = async () => {
    setReminders((prev) =>
      prev.filter((r) => new Date(r.remindAt).getTime() > Date.now()),
    );
    await api.delete("/api/reminders/clear").catch(() => {});
    fetchReminders();
  };

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markGroupRead,
    markAllRead,
    clearAll,
    fetchReminders,
  };
};
