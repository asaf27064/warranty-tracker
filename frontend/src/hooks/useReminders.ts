import { useState } from "react";
import api from "../api/axios";
import type { Reminder } from "../types";

export const useReminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const getAllReminders = async (productId: string) => {
    const res = await api.get(`/api/reminders/product/${productId}`);
    setReminders(res.data);
  };

  const createReminder = async (productId: string, daysBefore: number) => {
    await api.post(`/api/reminders/product/${productId}`, { daysBefore });
    await getAllReminders(productId);
  };

  const deleteReminder = async (reminderId: string, productId: string) => {
    await api.delete(`/api/reminders/${reminderId}`);
    await getAllReminders(productId);
  };

  const restoreDefaults = async (productId: string) => {
    const res = await api.post(
      `/api/reminders/product/${productId}/restore-defaults`,
    );
    await getAllReminders(productId);
    return res.data.created as number;
  };

  return {
    reminders,
    getAllReminders,
    createReminder,
    deleteReminder,
    restoreDefaults,
  };
};
