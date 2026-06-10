import { useState } from "react";
import api from "../api/axios";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.reply },
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
  };

  return { messages, sendMessage, loading, reset };
};
