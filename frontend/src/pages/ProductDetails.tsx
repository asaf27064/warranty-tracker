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
import WarrantyProgressBar from "../components/WarrantyProgressBar";
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
            <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
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
        // Sandboxed: render the PDF but block scripts/popups/top-navigation in
        // case a user uploads a maliciously crafted file.
        sandbox=""
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
  const { getProductById, deleteProduct } = useProducts();
  const { documents, getAllDocs, uploadDoc, deleteDoc } = useDocuments();
  const { reminders, getAllReminders, createReminder, deleteReminder } =
    useReminders();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysBefore, setDaysBefore] = useState(30);
  const [selectedDocType, setSelectedDocType] = useState("OTHER");
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ProductDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      if (!id) return;
      try {
        const data = await getProductById(id);
        setProduct(data);
        await getAllDocs(id);
        await getAllReminders(id);
      } catch (err) {
        console.error("fetchAll error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  const statusConfig = {
    ACTIVE: { color: "badge-active", label: "Active" },
    EXPIRING_SOON: { color: "badge-expiring", label: "Expiring Soon" },
    EXPIRED: { color: "badge-expired", label: "Expired" },
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(product.id);
      toast.success("Product deleted");
      navigate("/dashboard");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    await uploadDoc(id, file, selectedDocType);
  };

  const handleAddReminder = async () => {
    if (!id) return;
    await createReminder(id, daysBefore);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return Image;
    return FileText;
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
                {product.picture ? (
                  <img
                    src={product.picture}
                    alt={product.name}
                    className="h-24 w-24 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h1 className="truncate text-2xl font-bold text-foreground">
                        {product.name}
                      </h1>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {CategoryLabels[product.category] || product.category}
                      </p>
                    </div>
                    <Badge
                      className={`${statusConfig[product.status as keyof typeof statusConfig].color} shrink-0 border-0`}
                    >
                      {
                        statusConfig[product.status as keyof typeof statusConfig]
                          .label
                      }
                    </Badge>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-lg border border-border bg-muted/25">
                    <div className="grid sm:grid-cols-[0.9fr_1.1fr]">
                      <div className="border-b border-border p-4 sm:border-b-0 sm:border-r">
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                          {timeSignalLabel}
                        </p>
                        <p
                          className={`mt-1 text-3xl font-semibold tracking-tight ${statusColorClass}`}
                        >
                          {timeSignal}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {product.status === "EXPIRED"
                            ? "Coverage has ended"
                            : "Coverage still available"}
                        </p>
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

                  <WarrantyProgressBar
                    purchaseDate={product.purchaseDate}
                    warrantyExpiry={product.warrantyExpiry}
                    status={product.status}
                  />
                </div>
              </div>

              <div className="mt-5 flex gap-3 border-t border-border pt-4">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowProductModal(true)}
                >
                  <Pencil className="h-4 w-4" />
                  Edit Product
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
          <Card className="border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                Documents
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={selectedDocType}
                  onValueChange={(value) =>
                    setSelectedDocType(value ?? "OTHER")
                  }
                >
                  <SelectTrigger className="w-40 text-sm">
                    <SelectValue>{DocTypeLabels[selectedDocType]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DocTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => document.getElementById("docUpload")?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload
                </Button>

                <input
                  id="docUpload"
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleUploadDoc}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {documents.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No documents yet
                </p>
              ) : (
                documents.map((doc) => {
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
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                          {DocTypeLabels[doc.docType] || doc.docType}
                        </span>
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate text-sm text-foreground">
                          {doc.fileName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(doc.fileSize)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <Eye className="h-3 w-3" />
                          Preview
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteDoc(doc.id, product.id);
                          }}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:row-span-2"
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
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
          <Card className="border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                Reminders
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={daysBefore}
                  onChange={(e) => setDaysBefore(Number(e.target.value))}
                  className="w-20 text-center text-sm"
                />
                <span className="text-xs text-muted-foreground">
                  days before
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleAddReminder}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {reminders.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No reminders yet
                </p>
              ) : (
                reminders.map((reminder) => {
                  const daysUntil = Math.ceil(
                    (new Date(reminder.remindAt).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24),
                  );
                  return (
                    <div
                      key={reminder.id}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Bell
                          className={`h-4 w-4 ${reminder.sent ? "text-emerald-500" : "text-amber-500"}`}
                        />
                        <span className="text-sm text-foreground">
                          {new Date(reminder.remindAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {daysUntil > 0
                            ? `in ${daysUntil} days`
                            : reminder.sent
                              ? "Sent"
                              : "Due"}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteReminder(reminder.id, product.id)}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
          </motion.div>
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
    </div>
  );
};

export default ProductDetails;
