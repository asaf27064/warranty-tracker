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
  Sparkles,
  ImagePlus,
  FileText,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import ImageSearchModal from "./ImageSearchModal";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../hooks/useChat";
import { useProducts } from "../hooks/useProducts";
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
  const { accessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [hidden, setHidden] = useState(
    () => localStorage.getItem("wtChatHidden") === "1",
  );
  const [announceSeen, setAnnounceSeen] = useState(
    () => localStorage.getItem("wtChatAnnounceSeen") === "1",
  );
  const { messages, sendMessage, loading, reset, patchProduct } = useChat();
  const { updateProduct } = useProducts();
  const scrollRef = useRef<HTMLDivElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [photoTarget, setPhotoTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [receiptForId, setReceiptForId] = useState<string | null>(null);

  const dismissAnnounce = () => {
    setAnnounceSeen(true);
    localStorage.setItem("wtChatAnnounceSeen", "1");
  };

  // Hide the floating bubble entirely until the user brings it back.
  const dismissBubble = () => {
    setOpen(false);
    setHidden(true);
    localStorage.setItem("wtChatHidden", "1");
  };

  const openProduct = (p: Product) => {
    setOpen(false);
    navigate(`/product/${p.id}`);
  };

  // Attach a searched photo to a just-created product.
  const handlePhotoSelected = async (url: string) => {
    const target = photoTarget;
    if (!target) return;
    try {
      await updateProduct(target.id, { picture: url });
      patchProduct(target.id, { picture: url });
      toast.success("Photo added");
    } catch {
      toast.error("Couldn't add the photo");
    } finally {
      setPhotoTarget(null);
    }
  };

  const addReceipt = (productId: string) => {
    setReceiptForId(productId);
    receiptInputRef.current?.click();
  };

  const handleReceiptFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const productId = receiptForId;
    e.target.value = "";
    if (!file || !productId) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", "RECEIPT");
      await api.post(`/api/documents/product/${productId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Receipt added");
    } catch {
      toast.error("Couldn't upload the receipt");
    } finally {
      setReceiptForId(null);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Let other parts of the app (e.g. the sidebar "Ask assistant") open the chat.
  // This also un-hides the bubble if the user had dismissed it.
  useEffect(() => {
    const openChat = () => {
      setHidden(false);
      localStorage.setItem("wtChatHidden", "0");
      setOpen(true);
    };
    window.addEventListener("wt-open-chat", openChat);
    return () => window.removeEventListener("wt-open-chat", openChat);
  }, []);

  // Once the user opens the chat, the announcement has served its purpose.
  useEffect(() => {
    if (open && !announceSeen) dismissAnnounce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  if (!accessToken || hidden) return null;

  return (
    <>
      {/* First-visit announcement */}
      <AnimatePresence>
        {!open && !announceSeen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            className="fixed bottom-24 right-6 z-50 w-60 rounded-2xl border border-border bg-card p-3 pr-8 shadow-xl"
          >
            <button
              onClick={dismissAnnounce}
              aria-label="Dismiss"
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <button onClick={() => setOpen(true)} className="text-left">
              <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-sky-500" />
                Meet your AI assistant
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ask about your warranties or add a product just by chatting.
              </p>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating bubble (closed) or close button (open) */}
      {open ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(false)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700"
          aria-label="Close warranty assistant"
        >
          <X className="h-6 w-6" />
        </motion.button>
      ) : (
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700"
            aria-label="Open warranty assistant"
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>
          <button
            onClick={dismissBubble}
            aria-label="Hide assistant"
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </motion.div>
      )}

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
              className="nice-scroll flex-1 space-y-3 overflow-y-auto p-4"
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
                    dir="auto"
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

                  {(() => {
                    const created =
                      m.role === "assistant" && m.createdProductId
                        ? m.products?.find((p) => p.id === m.createdProductId)
                        : undefined;
                    if (!created) return null;
                    return (
                      <div className="mt-2 flex w-full flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setPhotoTarget({ id: created.id, name: created.name })
                          }
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs transition hover:bg-muted"
                        >
                          <ImagePlus className="h-3.5 w-3.5" />
                          Add photo
                        </button>
                        <button
                          type="button"
                          onClick={() => addReceipt(created.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs transition hover:bg-muted"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Add receipt
                        </button>
                        <button
                          type="button"
                          onClick={() => openProduct(created)}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs transition hover:bg-muted"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open product
                        </button>
                      </div>
                    );
                  })()}
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
                dir="auto"
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

      <ImageSearchModal
        open={photoTarget !== null}
        onClose={() => setPhotoTarget(null)}
        initialQuery={photoTarget?.name ?? ""}
        onSelect={handlePhotoSelected}
      />
      <input
        ref={receiptInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleReceiptFile}
      />
    </>
  );
};

export default ChatWidget;
