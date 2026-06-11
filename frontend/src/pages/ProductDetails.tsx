import { toast } from "sonner";
import { useProducts } from "../hooks/useProducts";
import { useDocuments } from "../hooks/useDocuments";
import { useReminders } from "../hooks/useReminders";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Product } from "../types";
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

  if (loading) return null;
  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  const statusConfig = {
    ACTIVE: { color: "bg-emerald-500/10 text-emerald-500", label: "Active" },
    EXPIRING_SOON: {
      color: "bg-amber-500/10 text-amber-500",
      label: "Expiring Soon",
    },
    EXPIRED: { color: "bg-red-500/10 text-red-500", label: "Expired" },
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl p-6">
        {/* Back button */}
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

        {/* Product Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border bg-card p-6">
            <div className="flex gap-5">
              {product.picture ? (
                <img
                  src={product.picture}
                  alt={product.name}
                  className="h-20 w-20 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-foreground">
                      {product.name}
                    </h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {CategoryLabels[product.category] || product.category}
                    </p>
                  </div>
                  <Badge
                    className={`${statusConfig[product.status as keyof typeof statusConfig].color} border-0`}
                  >
                    {
                      statusConfig[product.status as keyof typeof statusConfig]
                        .label
                    }
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Store: </span>
                    <span className="text-foreground">
                      {product.store || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Purchased: </span>
                    <span className="text-foreground">
                      {new Date(product.purchaseDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Warranty: </span>
                    <span className="text-foreground">
                      {product.warrantyMonths} months
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expires: </span>
                    <span className="text-foreground">
                      {new Date(product.warrantyExpiry).toLocaleDateString()}
                    </span>
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

        {/* Documents Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4"
        >
          <Card className="border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Documents
              </h2>
              <div className="flex items-center gap-2">
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
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                          {DocTypeLabels[doc.docType] || doc.docType}
                        </span>
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          {doc.fileName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(doc.fileSize)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-600"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </a>
                        <button
                          onClick={() => deleteDoc(doc.id, product.id)}
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

        {/* Reminders Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 mb-8"
        >
          <Card className="border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Reminders
              </h2>
              <div className="flex items-center gap-2">
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
    </div>
  );
};

export default ProductDetails;