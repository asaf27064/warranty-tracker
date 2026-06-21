import { toast } from "sonner";
import { useProducts } from "../hooks/useProducts";
import { useDocuments } from "../hooks/useDocuments";
import { useReminders } from "../hooks/useReminders";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Document as ProductDocument, Product } from "../types";
import { CategoryLabels, DocTypeLabels } from "../types";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Package,
  ArrowLeft,
  Upload,
  FileText,
  Image,
  Trash2,
  ExternalLink,
  Bell,
  Plus,
  Pencil,
  Eye,
  Download,
  ReceiptText,
  Store,
  CalendarDays,
  ShieldCheck,
  RotateCcw,
  Archive,
  ArchiveRestore,
  Maximize2,
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import ProductForm from "../components/ProductForm";
import ConfirmDialog from "../components/ConfirmDialog";
import { Skeleton } from "../components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

const ProductDetailsSkeleton = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="mx-auto max-w-6xl p-6">
      <Skeleton className="mt-4 mb-6 h-5 w-36" />
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border bg-card p-6">
          <div className="flex gap-5">
            <Skeleton className="h-44 w-44 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-3">
              <div className="flex justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>
        </Card>
        <Card className="border-border bg-card p-6">
          <Skeleton className="h-5 w-28" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        </Card>
      </div>
    </main>
  </div>
);

const DocumentPreview = ({
  doc,
  compact = false,
}: {
  doc: ProductDocument | null;
  compact?: boolean;
}) => {
  if (!doc) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/25 p-6 text-center">
        <ReceiptText className="h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium text-foreground">
          Select a receipt or document
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Preview images and PDFs without leaving this screen.
        </p>
      </div>
    );
  }

  if (doc.mimeType.startsWith("image/")) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/25">
        <img
          src={doc.fileUrl}
          alt={doc.fileName}
          className="max-h-full w-full object-contain"
        />
      </div>
    );
  }

  if (doc.mimeType === "application/pdf") {
    return (
      <iframe
        title={doc.fileName}
        src={doc.fileUrl}
        // No sandbox: Chrome's PDF viewer needs scripting, so a sandbox without
        // allow-scripts blocks it. The file is served from R2 on a different
        // origin, so the browser already isolates it from the app.
        className={`w-full rounded-lg border border-border bg-muted ${
          compact ? "h-[360px]" : "h-[72vh]"
        }`}
      />
    );
  }

  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-lg border border-border bg-muted/25 p-6 text-center">
      <FileText className="h-10 w-10 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium text-foreground">
        Preview unavailable
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Open this file in a new tab to view it.
      </p>
    </div>
  );
};

const ProductDetails = () => {
  const { getProductById, deleteProduct, setArchived } = useProducts();
  const { documents, getAllDocs, uploadDoc, updateDocType, deleteDoc } =
    useDocuments();
  const {
    reminders,
    getAllReminders,
    createReminder,
    deleteReminder,
    restoreDefaults,
  } = useReminders();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [daysBefore, setDaysBefore] = useState(30);
  const [dragOver, setDragOver] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ProductDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<ProductDocument | null>(null);
  const [reminderToDelete, setReminderToDelete] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<"documents" | "reminders">(
    "documents",
  );
  // Falls back to the icon if the photo is missing (e.g. deleted from R2).
  const [heroFailed, setHeroFailed] = useState(false);
  const [showCustomReminder, setShowCustomReminder] = useState(false);
  const [showPastReminders, setShowPastReminders] = useState(false);

  const fetchAll = async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(false);
    try {
      const data = await getProductById(id);
      setProduct(data);
      await getAllDocs(id);
      await getAllReminders(id);
    } catch (err) {
      console.error("fetchAll error:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (selectedDoc && documents.some((doc) => doc.id === selectedDoc.id)) {
      return;
    }
    const receipt =
      documents.find((doc) => doc.docType === "RECEIPT") ?? documents[0] ?? null;
    setSelectedDoc(receipt);
  }, [documents, selectedDoc]);

  if (loading) return <ProductDetailsSkeleton />;
  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-6xl p-4 sm:p-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 text-lg font-medium text-foreground">
              {loadError ? "Could not load this product" : "Product not found"}
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {loadError
                ? "Something went wrong while loading it. Please try again in a moment."
                : "It may have been deleted, or the link is no longer valid."}
            </p>
            <div className="mt-4 flex items-center gap-2">
              {loadError && (
                <Button variant="outline" onClick={fetchAll}>
                  Try again
                </Button>
              )}
              <Button
                variant={loadError ? "default" : "outline"}
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const statusConfig = {
    ACTIVE: { color: "badge-active", label: "Active" },
    EXPIRING_SOON: { color: "badge-expiring", label: "Expiring Soon" },
    EXPIRED: { color: "badge-expired", label: "Expired" },
  };

  const handleDelete = async () => {
    try {
      await deleteProduct(product.id);
      toast.success("Product deleted");
      navigate("/dashboard");
    } catch (e) {
      toast.error("Failed to delete product");
      throw e; // keep the confirm dialog open
    }
  };

  const handleToggleArchive = async () => {
    try {
      await setArchived([product.id], !product.archived);
      setProduct({ ...product, archived: !product.archived });
      toast.success(product.archived ? "Product unarchived" : "Product archived");
    } catch {
      toast.error("Failed to update product");
    }
  };

  const handleDeleteDoc = async () => {
    if (!docToDelete) return;
    try {
      await deleteDoc(docToDelete.id, product.id);
      toast.success("Document deleted");
    } catch (e) {
      toast.error("Failed to delete document");
      throw e;
    }
  };

  const handleDeleteReminder = async () => {
    if (!reminderToDelete) return;
    try {
      await deleteReminder(reminderToDelete, product.id);
      toast.success("Reminder deleted");
    } catch (e) {
      toast.error("Failed to delete reminder");
      throw e;
    }
  };

  // Guess the document type from the file name / mime.
  const guessDocType = (file: File) => {
    const n = file.name.toLowerCase();
    if (n.includes("invoice")) return "INVOICE";
    if (n.includes("warrant")) return "WARRANTY_CERTIFICATE";
    if (n.includes("receipt")) return "RECEIPT";
    if (file.type.startsWith("image/")) return "PHOTO";
    return "RECEIPT";
  };

  const uploadFiles = async (files: File[]) => {
    if (!id || files.length === 0) return;
    try {
      for (const file of files) {
        await uploadDoc(id, file, guessDocType(file));
      }
      toast.success(
        files.length > 1 ? `${files.length} documents added` : "Document added",
      );
    } catch {
      toast.error("Failed to upload");
    }
  };

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file
    await uploadFiles(files);
  };

  const handleDropDocs = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    await uploadFiles(Array.from(e.dataTransfer.files ?? []));
  };

  const handleAddReminder = async (days: number = daysBefore) => {
    if (!id) return;
    const d = Math.min(365, Math.max(1, Math.round(days || 0)));
    try {
      await createReminder(id, d);
      toast.success(`Reminder added (${d} day${d === 1 ? "" : "s"} before expiry)`);
      setShowCustomReminder(false);
    } catch (e) {
      const status = (e as { response?: { status?: number } }).response?.status;
      if (status === 400) {
        toast.error("This warranty has already expired");
      } else if (status === 409) {
        toast.info("That reminder already exists");
      } else {
        toast.error("Failed to add reminder");
      }
    }
  };

  const handleRestoreDefaults = async () => {
    if (!id) return;
    try {
      const created = await restoreDefaults(id);
      toast.success(
        created > 0
          ? `Restored ${created} default reminder${created === 1 ? "" : "s"}`
          : "Default reminders are already set",
      );
    } catch {
      toast.error("Failed to restore default reminders");
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return Image;
    return FileText;
  };

  const docTone = (type: string) => {
    switch (type) {
      case "RECEIPT":
        return "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400";
      case "INVOICE":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "WARRANTY_CERTIFICATE":
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400";
      case "PHOTO":
        return "bg-violet-500/10 text-violet-600 dark:text-violet-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const daysLeft = Math.ceil(
    (new Date(product.warrantyExpiry).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24),
  );

  // True when a future 30/7/1 default slot has no reminder.
  const futureDefaultSlots = [30, 7, 1]
    .map((days) => {
      const slot = new Date(product.warrantyExpiry);
      slot.setDate(slot.getDate() - days);
      slot.setHours(8, 0, 0, 0);
      return slot.getTime();
    })
    .filter((t) => t > Date.now());
  const missingDefaults =
    product.status !== "EXPIRED" &&
    futureDefaultSlots.some(
      (t) => !reminders.some((r) => new Date(r.remindAt).getTime() === t),
    );
  const timeSignal =
    daysLeft < 0
      ? `${Math.abs(daysLeft)} days ago`
      : daysLeft === 0
        ? "Today"
        : `${daysLeft} days`;
  const timeSignalLabel =
    daysLeft < 0 ? "Warranty expired" : daysLeft === 0 ? "Expires today" : "Remaining";
  const statusColorClass =
    product.status === "EXPIRED"
      ? "c-expired"
      : product.status === "EXPIRING_SOON"
        ? "c-expiring"
        : "c-active";

  // Percentage of the warranty period that has elapsed (for the ring gauge).
  const totalMs =
    new Date(product.warrantyExpiry).getTime() -
    new Date(product.purchaseDate).getTime();
  const elapsedMs = Date.now() - new Date(product.purchaseDate).getTime();
  const pctElapsed =
    totalMs > 0
      ? Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)))
      : daysLeft < 0
        ? 100
        : 0;
  const RING_R = 15.5;
  const RING_C = 2 * Math.PI * RING_R;
  const isWarrantyFull = pctElapsed >= 100;
  const ringGlow =
    product.status === "EXPIRED"
      ? "rgba(200,80,80,0.35)"
      : product.status === "EXPIRING_SOON"
        ? "rgba(200,150,40,0.3)"
        : "rgba(45,150,110,0.3)";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl p-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 mb-6"
        >
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="border-border bg-card p-6">
              <div className="flex flex-col gap-5 sm:flex-row">
                {product.picture && !heroFailed ? (
                  <button
                    type="button"
                    onClick={() => setImageOpen(true)}
                    aria-label="Expand image"
                    className="group relative h-48 w-full shrink-0 cursor-zoom-in overflow-hidden rounded-xl bg-muted sm:h-56 sm:w-56"
                  >
                    <img
                      src={product.picture}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl"
                    />
                    <img
                      src={product.picture}
                      alt={product.name}
                      onError={() => setHeroFailed(true)}
                      className="relative z-[1] h-full w-full object-contain"
                    />
                    <span className="absolute right-2 top-2 z-[2] flex h-8 w-8 items-center justify-center rounded-md bg-background/70 text-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      <Maximize2 className="h-4 w-4" />
                    </span>
                  </button>
                ) : (
                  <div className="flex h-48 w-full shrink-0 items-center justify-center rounded-xl bg-muted sm:h-56 sm:w-56">
                    <Package className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h1 className="truncate text-2xl font-bold text-foreground">
                        {product.name}
                      </h1>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {CategoryLabels[product.category] || product.category}
                        </span>
                        <Badge
                          className={`${statusConfig[product.status as keyof typeof statusConfig].color} border-0`}
                        >
                          {
                            statusConfig[
                              product.status as keyof typeof statusConfig
                            ].label
                          }
                        </Badge>
                        {product.archived && (
                          <Badge className="gap-1 border-0 bg-muted text-muted-foreground">
                            <Archive className="h-3 w-3" />
                            Archived
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setShowProductModal(true)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={handleToggleArchive}
                      >
                        {product.archived ? (
                          <ArchiveRestore className="h-4 w-4" />
                        ) : (
                          <Archive className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline">
                          {product.archived ? "Unarchive" : "Archive"}
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                        onClick={() => setDeleteOpen(true)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-lg border border-border bg-muted/25">
                    <div className="grid sm:grid-cols-[0.9fr_1.1fr]">
                      <div className="flex items-center gap-4 border-b border-border p-4 sm:border-b-0 sm:border-r">
                        <motion.div
                          className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
                          animate={{
                            boxShadow: isWarrantyFull
                              ? [
                                  "0 0 0px rgba(0,0,0,0)",
                                  `0 0 12px ${ringGlow}`,
                                  "0 0 0px rgba(0,0,0,0)",
                                ]
                              : "0 0 0px rgba(0,0,0,0)",
                          }}
                          transition={{
                            boxShadow: isWarrantyFull
                              ? {
                                  duration: 1.4,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }
                              : { duration: 0.2 },
                          }}
                        >
                          <svg
                            viewBox="0 0 36 36"
                            className={`h-20 w-20 -rotate-90 ${statusColorClass}`}
                          >
                            <circle
                              cx="18"
                              cy="18"
                              r={RING_R}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              className="text-muted-foreground/20"
                            />
                            <motion.circle
                              cx="18"
                              cy="18"
                              r={RING_R}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeDasharray={RING_C}
                              initial={{ strokeDashoffset: RING_C }}
                              animate={{
                                strokeDashoffset: RING_C * (1 - pctElapsed / 100),
                              }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </svg>
                          <span
                            className={`absolute text-base font-bold ${statusColorClass}`}
                          >
                            {pctElapsed}%
                          </span>
                        </motion.div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase text-muted-foreground">
                            {timeSignalLabel}
                          </p>
                          <p
                            className={`mt-0.5 text-2xl font-semibold tracking-tight ${statusColorClass}`}
                          >
                            {timeSignal}
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {product.status === "EXPIRED"
                              ? "Coverage has ended"
                              : "Coverage still available"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-px bg-border text-sm">
                        <div className="bg-card p-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Purchased
                          </div>
                          <p className="mt-1 font-medium text-foreground">
                            {new Date(product.purchaseDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="bg-card p-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Expires
                          </div>
                          <p className="mt-1 font-medium text-foreground">
                            {new Date(product.warrantyExpiry).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="bg-card p-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Store className="h-3.5 w-3.5" />
                            Store
                          </div>
                          <p className="mt-1 truncate font-medium text-foreground">
                            {product.store || "N/A"}
                          </p>
                        </div>
                        <div className="bg-card p-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Warranty
                          </div>
                          <p className="mt-1 font-medium text-foreground">
                            {product.warrantyMonths} months
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={
              leftTab === "reminders" || documents.length === 0
                ? "lg:col-span-2"
                : undefined
            }
          >
            <Card className="border-border bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex rounded-lg border border-border p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setLeftTab("documents");
                      setShowCustomReminder(false);
                    }}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      leftTab === "documents"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Documents ({documents.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeftTab("reminders")}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      leftTab === "reminders"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Reminders ({reminders.length})
                  </button>
                </div>

                {leftTab === "documents" ? (
                  <input
                    id="docUpload"
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleUploadDoc}
                  />
                ) : product.status === "EXPIRED" ? null : showCustomReminder ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={daysBefore}
                      onChange={(e) =>
                        setDaysBefore(
                          Math.min(365, Math.max(1, Number(e.target.value) || 1)),
                        )
                      }
                      className="w-20 text-center text-sm"
                    />
                    <span className="text-xs text-muted-foreground">
                      days before
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleAddReminder(daysBefore)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomReminder(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs text-muted-foreground">
                      Remind me
                    </span>
                    {[
                      { label: "1 week before", d: 7 },
                      { label: "1 month before", d: 30 },
                      { label: "3 months before", d: 90 },
                    ].map((p) => (
                      <Button
                        key={p.d}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddReminder(p.d)}
                      >
                        {p.label}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-dashed"
                      onClick={() => setShowCustomReminder(true)}
                    >
                      Custom…
                    </Button>
                  </div>
                )}
              </div>

              {leftTab === "documents" ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDropDocs}
                  className={`mt-4 flex flex-col gap-2 rounded-lg transition-colors ${
                    dragOver
                      ? "ring-2 ring-emerald-500/40 ring-offset-2 ring-offset-background"
                      : ""
                  }`}
                >
                  {documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted py-10 text-center">
                      <ReceiptText className="h-9 w-9 text-muted-foreground" />
                      <p className="mt-3 text-sm font-medium text-foreground">
                        No documents yet
                      </p>
                      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                        Add a receipt, invoice, or warranty card to keep it with
                        this product.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4 gap-2"
                        onClick={() =>
                          document.getElementById("docUpload")?.click()
                        }
                      >
                        <Upload className="h-4 w-4" />
                        Add your first document
                      </Button>
                    </div>
                  ) : (
                    <>
                    {documents.map((doc) => {
                      const FileIcon = getFileIcon(doc.mimeType);
                      return (
                        <div
                          key={doc.id}
                          role="button"
                          tabIndex={0}
                          aria-pressed={selectedDoc?.id === doc.id}
                          onClick={() => setSelectedDoc(doc)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedDoc(doc);
                            }
                          }}
                          className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
                            selectedDoc?.id === doc.id
                              ? "bg-emerald-500/10 ring-1 ring-emerald-500/25"
                              : "bg-muted/50 hover:bg-muted"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${docTone(doc.docType)}`}
                            >
                              <FileIcon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {doc.fileName}
                              </p>
                              <div
                                className="mt-0.5 flex items-center gap-2"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <Select
                                  value={doc.docType}
                                  onValueChange={(value) =>
                                    value &&
                                    updateDocType(doc.id, product.id, value)
                                  }
                                >
                                  <SelectTrigger className="h-7 w-auto gap-1 rounded-md border-border bg-transparent px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
                                    <SelectValue>
                                      {DocTypeLabels[doc.docType] || doc.docType}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(DocTypeLabels).map(
                                      ([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                          {label}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                                <span className="text-xs text-muted-foreground">
                                  {" · "}
                                  {formatFileSize(doc.fileSize)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedDoc(doc);
                                setPreviewOpen(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10 dark:text-emerald-400"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setDocToDelete(doc);
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("docUpload")?.click()
                      }
                      className={`flex items-center justify-center gap-2 rounded-lg border border-dashed py-3 text-sm transition-colors ${
                        dragOver
                          ? "border-emerald-500 bg-emerald-500/5 text-foreground"
                          : "border-border bg-muted text-muted-foreground hover:border-emerald-500/60"
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      Drop files here or click to upload
                    </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-2">
                  {product.status === "EXPIRED" ? (
                    <p className="text-xs text-muted-foreground">
                      This warranty expired on{" "}
                      {new Date(product.warrantyExpiry).toLocaleDateString()}.
                      Reminders are no longer scheduled.
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        Reminders are set 30, 7, and 1 days before expiry by
                        default.
                      </p>
                      {missingDefaults && (
                        <button
                          type="button"
                          onClick={handleRestoreDefaults}
                          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restore defaults
                        </button>
                      )}
                    </div>
                  )}
                  {reminders.length === 0 ? (
                    product.status !== "EXPIRED" && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No reminders yet
                      </p>
                    )
                  ) : (
                    (() => {
                      const now = Date.now();
                      const renderRow = (
                        reminder: (typeof reminders)[number],
                      ) => {
                        const daysUntil = Math.ceil(
                          (new Date(reminder.remindAt).getTime() - now) /
                            (1000 * 60 * 60 * 24),
                        );
                        const dayStart = (d: string) => {
                          const x = new Date(d);
                          x.setHours(0, 0, 0, 0);
                          return x.getTime();
                        };
                        const daysBeforeExpiry = Math.round(
                          (dayStart(product.warrantyExpiry) -
                            dayStart(reminder.remindAt)) /
                            (1000 * 60 * 60 * 24),
                        );
                        const lead =
                          daysBeforeExpiry > 0
                            ? `${daysBeforeExpiry} day${daysBeforeExpiry === 1 ? "" : "s"} before expiry`
                            : `Reminds on ${new Date(reminder.remindAt).toLocaleDateString()}`;
                        const isDefault = reminder.isDefault;
                        const when =
                          daysUntil > 0
                            ? `in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`
                            : reminder.sent
                              ? "Sent"
                              : "Due";
                        return (
                          <div
                            key={reminder.id}
                            className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-4 py-3"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <Bell
                                className={`h-4 w-4 shrink-0 ${reminder.sent ? "text-emerald-500" : "text-amber-500"}`}
                              />
                              <div className="min-w-0">
                                <p className="flex items-center gap-2 text-sm text-foreground">
                                  <span className="truncate">{lead}</span>
                                  {isDefault && (
                                    <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                      Default
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(
                                    reminder.remindAt,
                                  ).toLocaleDateString()}
                                  {" · "}
                                  {when}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setReminderToDelete(reminder.id)}
                              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        );
                      };
                      const sorted = [...reminders].sort(
                        (a, b) =>
                          new Date(a.remindAt).getTime() -
                          new Date(b.remindAt).getTime(),
                      );
                      const upcoming = sorted.filter(
                        (r) => new Date(r.remindAt).getTime() > now,
                      );
                      const past = sorted
                        .filter((r) => new Date(r.remindAt).getTime() <= now)
                        .reverse();
                      return (
                        <>
                          {upcoming.length === 0 && (
                            <p className="py-2 text-center text-xs text-muted-foreground">
                              No upcoming reminders
                            </p>
                          )}
                          {upcoming.map(renderRow)}
                          {past.length > 0 && (
                            <>
                              <button
                                type="button"
                                onClick={() => setShowPastReminders((v) => !v)}
                                className="mt-1 self-start text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                              >
                                {showPastReminders ? "Hide" : "Show"} past ({past.length})
                              </button>
                              {showPastReminders && past.map(renderRow)}
                            </>
                          )}
                        </>
                      );
                    })()
                  )}
                </div>
              )}
            </Card>
          </motion.div>

          {leftTab === "documents" && documents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <Card className="sticky top-6 border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Receipt preview
                  </h2>
                  <p className="mt-1 max-w-md truncate text-sm text-muted-foreground">
                    {selectedDoc?.fileName ?? "No document selected"}
                  </p>
                </div>
                {selectedDoc && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setPreviewOpen(true)}
                    >
                      <Eye className="h-4 w-4" />
                      Expand
                    </Button>
                    <a
                      href={selectedDoc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open
                    </a>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <DocumentPreview doc={selectedDoc} compact />
              </div>

              {documents.length > 0 && (
                <div className="nice-scroll mt-3 flex gap-2 overflow-x-auto pb-1">
                  {documents.map((doc) => {
                    const isImg = doc.mimeType.startsWith("image/");
                    const FileIcon = getFileIcon(doc.mimeType);
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setSelectedDoc(doc)}
                        title={doc.fileName}
                        aria-label={`Preview ${doc.fileName}`}
                        className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted transition-colors ${
                          selectedDoc?.id === doc.id
                            ? "border-emerald-500 ring-1 ring-emerald-500/40"
                            : "border-border hover:border-foreground/30"
                        }`}
                      >
                        {isImg ? (
                          <img
                            src={doc.fileUrl}
                            alt={doc.fileName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FileIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
          )}
        </div>
      </main>

      {product && (
        <ProductForm
          open={showProductModal}
          onClose={() => setShowProductModal(false)}
          product={product}
          onSuccess={async () => {
            if (!id) return;
            const updated = await getProductById(id);
            setProduct(updated);
            setShowProductModal(false);
          }}
        />
      )}

      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-border p-4 pr-12">
            <DialogTitle className="truncate">{product.name}</DialogTitle>
          </DialogHeader>
          <div className="flex max-h-[calc(92vh-72px)] items-center justify-center overflow-auto p-4">
            {product.picture && (
              <img
                src={product.picture}
                alt={product.name}
                className="max-h-[80vh] w-auto object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="border-b border-border p-4 pr-12">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <DialogTitle className="truncate">
                  {selectedDoc?.fileName ?? "Document preview"}
                </DialogTitle>
                {selectedDoc && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {DocTypeLabels[selectedDoc.docType] ?? selectedDoc.docType}
                  </p>
                )}
              </div>
              {selectedDoc && (
                <a
                  href={selectedDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
                >
                  <Download className="h-4 w-4" />
                  Open file
                </a>
              )}
            </div>
          </DialogHeader>
          <div className="nice-scroll max-h-[calc(92vh-82px)] overflow-auto p-4">
            <DocumentPreview doc={selectedDoc} />
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete product?"
        description={
          <>
            This permanently deletes{" "}
            <span className="font-medium text-foreground">{product.name}</span>{" "}
            and its documents and reminders. This can't be undone.
          </>
        }
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={docToDelete !== null}
        onOpenChange={(open) => !open && setDocToDelete(null)}
        title="Delete document?"
        description={
          <>
            This removes{" "}
            <span className="font-medium text-foreground">
              {docToDelete?.fileName}
            </span>
            . This can't be undone.
          </>
        }
        onConfirm={handleDeleteDoc}
      />

      <ConfirmDialog
        open={reminderToDelete !== null}
        onOpenChange={(open) => !open && setReminderToDelete(null)}
        title="Delete reminder?"
        description="This removes the reminder for this product."
        onConfirm={handleDeleteReminder}
      />
    </div>
  );
};

export default ProductDetails;
