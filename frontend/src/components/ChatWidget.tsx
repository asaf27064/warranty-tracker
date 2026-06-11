import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  X,
  Bot,
  Loader2,
  SquarePen,
  Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useChat } from "../hooks/useChat";
import { StatusLabels } from "../types";
import type { Product } from "../types";

const statusColor: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  EXPIRING_SOON: "bg-amber-100 text-amber-700",
  EXPIRED: "bg-red-100 text-red-700",
};

// Max product cards to render inline before collapsing into a "+N more" note.
const MAX_CARDS = 8;

const ChatWidget = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, loading, reset } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  const openProduct = (p: Product) => {
    setOpen(false);
    navigate(`/product/${p.id}`);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  return (
    <>
      {/* Floating toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700"
        aria-label="Open warranty assistant"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 flex h-128 w-88 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:w-96"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-emerald-600 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">Warranty Assistant</p>
                  <p className="text-xs text-emerald-100">Ask about your warranties</p>
                </div>
              </div>
              <button
                onClick={reset}
                title="New chat"
                aria-label="New chat"
                className="rounded-md p-1.5 hover:bg-emerald-700"
              >
                <SquarePen className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto p-4"
            >
              {messages.length === 0 && (
                <div className="mt-8 text-center text-sm text-muted-foreground">
                  <Bot className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p>Hi! Ask me things like:</p>
                  <p className="mt-2 italic">
                    "Which warranties expire soon?"
                  </p>
                  <p className="italic">"Remind me 30 days before my fridge expires"</p>
                </div>
              )}
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex flex-col ${
                    m.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "whitespace-pre-wrap bg-emerald-600 text-white"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => (
                            <p className="mb-1 last:mb-0">{children}</p>
                          ),
                          ul: ({ children }) => (
                            <ul className="my-1 list-disc pl-4">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="my-1 list-decimal pl-4">{children}</ol>
                          ),
                          li: ({ children }) => (
                            <li className="mb-0.5">{children}</li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold">{children}</strong>
                          ),
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    ) : (
                      m.content
                    )}
                  </div>

                  {m.role === "assistant" &&
                    m.products &&
                    m.products.length > 0 && (
                      <div className="mt-2 flex w-full flex-col gap-2">
                        {m.products.slice(0, MAX_CARDS).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => openProduct(p)}
                            className="flex items-center gap-3 rounded-xl border border-border bg-background p-2 text-left transition hover:bg-muted"
                          >
                            {p.picture ? (
                              <img
                                src={p.picture}
                                alt={p.name}
                                className="h-10 w-10 flex-shrink-0 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-muted">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {p.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Expires{" "}
                                {new Date(
                                  p.warrantyExpiry,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <span
                              className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                statusColor[p.status] ??
                                "bg-muted text-muted-foreground"
                              }`}
                            >
                              {StatusLabels[p.status]}
                            </span>
                          </button>
                        ))}
                        {m.products.length > MAX_CARDS && (
                          <p className="px-1 text-xs text-muted-foreground">
                            + {m.products.length - MAX_CARDS} more
                          </p>
                        )}
                      </div>
                    )}
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 border-t border-border p-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about your warranties..."
                disabled={loading}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
