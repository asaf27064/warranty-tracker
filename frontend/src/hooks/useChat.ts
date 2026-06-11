import { useState, useEffect } from "react";
import api from "../api/axios";
import type { Product } from "../types";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  products?: Product[];
};

// Persisted so the chat survives navigation and page refreshes.
const STORAGE_KEY = "warrantyChatConversationId";

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  );
  const [loading, setLoading] = useState(false);

  // On mount, reload a previously-persisted conversation's history.
  useEffect(() => {
    const id = localStorage.getItem(STORAGE_KEY);
    if (!id) return;
    api
      .get(`/api/ai/conversations/${id}`)
      .then((res) => setMessages(res.data))
      .catch(() => {
        // Conversation gone (deleted/expired) — clear the stale id.
        localStorage.removeItem(STORAGE_KEY);
        setConversationId(null);
      });
  }, []);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);
    try {
      const res = await api.post("/api/ai/chat", {
        message: trimmed,
        ...(conversationId ? { conversationId } : {}),
      });
      setConversationId(res.data.conversationId);
      localStorage.setItem(STORAGE_KEY, res.data.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.data.reply,
          products: res.data.products ?? [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([]);
    setConversationId(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { messages, sendMessage, loading, reset };
};
