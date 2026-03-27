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

  useEffect(() => {
    const fetchAll = async () => {
      if (!id) return;
      try {
        const data = await getProductById(id);
        setProduct(data);
        await getAllDocs(id);
        await getAllReminders(id);
      } catch {
        console.error("Product not found");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) return null;
  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-zinc-400">Product not found</p>
      </div>
    );
  }

  const totalWarranty =
    new Date(product.warrantyExpiry).getTime() -
    new Date(product.purchaseDate).getTime();
  const timeUsed = Date.now() - new Date(product.purchaseDate).getTime();
  const percentUsed = Math.max(
    0,
    Math.min(100, Math.round((timeUsed / totalWarranty) * 100)),
  );

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
    await deleteProduct(product.id);
    navigate("/dashboard");
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
    <div className="min-h-screen bg-zinc-950">
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
            className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </motion.div>

        {/* ════════ Product Info Card ════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-zinc-800 bg-zinc-900 p-6">
            <div className="flex gap-5">
              {/* Image */}
              {product.picture ? (
                <img
                  src={product.picture}
                  alt={product.name}
                  className="h-20 w-20 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
                  <Package className="h-8 w-8 text-zinc-500" />
                </div>
              )}

              {/* Details */}
              <div className="flex-1">
                {/* Name + Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-white">
                      {product.name}
                    </h1>
                    <p className="mt-0.5 text-sm text-zinc-400">
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

                {/* Info Grid */}
                <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div>
                    <span className="text-zinc-400">Store: </span>
                    <span className="text-white">{product.store || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Purchased: </span>
                    <span className="text-white">
                      {new Date(product.purchaseDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Warranty: </span>
                    <span className="text-white">
                      {product.warrantyMonths} months
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Expires: </span>
                    <span className="text-white">
                      {new Date(product.warrantyExpiry).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-zinc-500">
                    <span>Warranty used</span>
                    <span>{percentUsed}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        product.status === "ACTIVE"
                          ? "bg-emerald-500"
                          : product.status === "EXPIRING_SOON"
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${percentUsed}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 flex gap-3 border-t border-zinc-800 pt-4">
              <Button
                variant="outline"
                className="gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                onClick={() => {
                  /* TODO: open edit modal */
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit Product
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-zinc-700 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* ════════ Documents Card ════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4"
        >
          <Card className="border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Documents</h2>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedDocType}
                  onValueChange={(value) =>
                    setSelectedDocType(value ?? "OTHER")
                  }
                >
                  <SelectTrigger className="w-40 border-zinc-700 bg-zinc-800 text-sm text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-700 bg-zinc-800">
                    {Object.entries(DocTypeLabels).map(([value, label]) => (
                      <SelectItem
                        key={value}
                        value={value}
                        className="text-zinc-300"
                      >
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
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
                <p className="py-4 text-center text-sm text-zinc-500">
                  No documents yet
                </p>
              ) : (
                documents.map((doc) => {
                  const FileIcon = getFileIcon(doc.mimeType);
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] uppercase text-zinc-400">
                          {DocTypeLabels[doc.docType] || doc.docType}
                        </span>
                        <FileIcon className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm text-white">
                          {doc.fileName}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {formatFileSize(doc.fileSize)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </a>
                        <button
                          onClick={() => deleteDoc(doc.id, product.id)}
                          className="text-xs text-red-400 hover:text-red-300"
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

        {/* ════════ Reminders Card ════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 mb-8"
        >
          <Card className="border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Reminders</h2>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={daysBefore}
                  onChange={(e) => setDaysBefore(Number(e.target.value))}
                  className="w-20 border-zinc-700 bg-zinc-800 text-center text-sm text-white"
                />
                <span className="text-xs text-zinc-400">days before</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  onClick={handleAddReminder}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {reminders.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-500">
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
                      className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Bell
                          className={`h-4 w-4 ${reminder.sent ? "text-emerald-400" : "text-amber-400"}`}
                        />
                        <span className="text-sm text-white">
                          {new Date(reminder.remindAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {daysUntil > 0
                            ? `in ${daysUntil} days`
                            : reminder.sent
                              ? "Sent"
                              : "Due"}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteReminder(reminder.id, product.id)}
                        className="text-xs text-red-400 hover:text-red-300"
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
    </div>
  );
};

export default ProductDetails;
