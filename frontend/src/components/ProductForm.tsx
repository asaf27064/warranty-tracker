import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import DatePicker from "./DatePicker";
import {
  Calendar,
  Eye,
  FileText,
  ImagePlus,
  Package,
  ReceiptText,
  Save,
  Search,
  Sparkles,
  Store,
  Upload,
  X,
} from "lucide-react";
import { Category, CategoryLabels, DocTypeLabels } from "../types";
import type { Product } from "../types";
import { useProducts } from "../hooks/useProducts";
import ImageSearchModal from "./ImageSearchModal";
import api from "../api/axios";

type Props = {
  open: boolean;
  onClose: () => void;
  product?: Product;
  onSuccess: () => void;
};

type ProductFormData = {
  name: string;
  category: string;
  purchaseDate: string;
  warrantyDuration: number;
  warrantyUnit: string;
  store: string;
  picture: string;
};

const ProductForm = ({ product, open, onClose, onSuccess }: Props) => {
  const { createProduct, updateProduct } = useProducts();
  const [loading, setLoading] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [docFiles, setDocFiles] = useState<{ file: File; docType: string }[]>(
    [],
  );
  const [selectedDocType, setSelectedDocType] = useState("OTHER");
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [aiHint, setAiHint] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const isEdit = !!product;

  // Client-side preview of a staged (not-yet-uploaded) document via object URL.
  const [previewDoc, setPreviewDoc] = useState<{
    name: string;
    type: string;
    url: string;
  } | null>(null);

  const openDocPreview = (file: File) => {
    setPreviewDoc({
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
    });
  };

  const closeDocPreview = () => {
    setPreviewDoc((p) => {
      if (p) URL.revokeObjectURL(p.url);
      return null;
    });
  };

  const clearImage = () => {
    if (imagePreview && imageFile) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageFile(null);
    setForm((prev) => ({ ...prev, picture: "" }));
  };

  const [form, setForm] = useState<ProductFormData>({
    name: "",
    category: Category.NONE as string,
    purchaseDate: "",
    warrantyDuration: 12,
    warrantyUnit: "Months",
    store: "",
    picture: "",
  });

  useEffect(() => {
    if (!open) return;

    if (product) {
      const months = product.warrantyMonths;
      const isYears = months >= 12 && months % 12 === 0;
      setForm({
        name: product.name,
        category: product.category,
        purchaseDate: new Date(product.purchaseDate)
          .toISOString()
          .split("T")[0],
        warrantyDuration: isYears ? months / 12 : months,
        warrantyUnit: isYears ? "Years" : "Months",
        store: product.store || "",
        picture: product.picture || "",
      });
      setImagePreview(product.picture || null);
    } else {
      setForm({
        name: "",
        category: Category.NONE as string,
        purchaseDate: "",
        warrantyDuration: 12,
        warrantyUnit: "Months",
        store: "",
        picture: "",
      });
      setImagePreview(null);
    }

    setImageFile(null);
    setLoading(false);
    setDocFiles([]);
    setSelectedDocType("OTHER");
    setAiText("");
    setMissingFields([]);
    setAiHint(false);
    setSaveError(null);
    submittingRef.current = false;
  }, [product, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
    setMissingFields((prev) => prev.filter((f) => f !== name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Block re-entry while a save is already in flight (ref updates synchronously,
    // so rapid double-clicks are caught before `loading` re-renders).
    if (submittingRef.current) return;

    const missing: string[] = [];
    if (!form.name) missing.push("name");
    if (!form.purchaseDate) missing.push("purchaseDate");
    if (!form.warrantyDuration) missing.push("warrantyDuration");
    if (missing.length > 0) {
      setMissingFields(missing);
      return;
    }

    submittingRef.current = true;
    setSaveError(null);
    setLoading(true);

    const warrantyMonths =
      form.warrantyUnit === "Years"
        ? form.warrantyDuration * 12
        : form.warrantyDuration;

    let pictureUrl = form.picture;

    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await api.post("/api/images/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        pictureUrl = uploadRes.data.url;
      }

      let productId: string | undefined;

      if (isEdit && product) {
        await updateProduct(product.id, {
          name: form.name,
          category: form.category as Category,
          purchaseDate: new Date(form.purchaseDate).toISOString(),
          warrantyMonths,
          store: form.store || null,
          picture: pictureUrl || null,
        });
        productId = product.id;
      } else {
        const res = await createProduct({
          name: form.name,
          category: form.category as Category,
          purchaseDate: new Date(form.purchaseDate).toISOString(),
          warrantyMonths,
          store: form.store || undefined,
          picture: pictureUrl || undefined,
        });
        productId = res?.id;
      }

      if (docFiles.length > 0 && productId) {
        for (const doc of docFiles) {
          const formData = new FormData();
          formData.append("file", doc.file);
          formData.append("docType", doc.docType);
          await api.post(`/api/documents/product/${productId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      }
      toast.success(isEdit ? "Product updated" : "Product added");
      onSuccess();
      // On success, intentionally leave `loading` and the submit guard set:
      // the dialog closes via onSuccess, and both reset when it reopens
      // (see the open effect). This prevents a duplicate submit during the
      // async gap before the dialog actually closes.
    } catch (error) {
      console.error(error);
      setSaveError("Failed to save product. Please try again.");
      toast.error("Failed to save product");
      setLoading(false);
      submittingRef.current = false;
    }
  };

  // Partial product returned by both extraction endpoints (any field may be missing).
  type ExtractedProduct = {
    name?: string;
    store?: string | null;
    category?: string;
    purchaseDate?: string;
    warrantyMonths?: number;
  };

  // Apply an extracted partial product to the form and flag missing required fields.
  const applyExtracted = (p: ExtractedProduct) => {
    const hasMonths = typeof p.warrantyMonths === "number";
    const isYears =
      hasMonths && p.warrantyMonths! >= 12 && p.warrantyMonths! % 12 === 0;

    setForm((prev) => ({
      ...prev,
      name: p.name ?? prev.name,
      store: p.store ?? prev.store,
      category: p.category ?? prev.category,
      purchaseDate: p.purchaseDate ?? prev.purchaseDate,
      warrantyDuration: hasMonths
        ? isYears
          ? p.warrantyMonths! / 12
          : p.warrantyMonths!
        : prev.warrantyDuration,
      warrantyUnit: hasMonths ? (isYears ? "Years" : "Months") : prev.warrantyUnit,
    }));

    const missing: string[] = [];
    if (!p.name) missing.push("name");
    if (!p.purchaseDate) missing.push("purchaseDate");
    if (!hasMonths) missing.push("warrantyDuration");
    setMissingFields(missing);
    setAiHint(missing.length > 0);
  };

  const handleAiFill = async () => {
    if (!aiText.trim()) return;

    setAiLoading(true);
    setMissingFields([]);
    setAiHint(false);
    try {
      const res = await api.post("/api/ai/extract-product", { text: aiText });
      applyExtracted(res.data);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't extract details from that text");
    } finally {
      setAiLoading(false);
    }
  };

  const handleReceiptUpload = async (file: File) => {
    setAiLoading(true);
    setMissingFields([]);
    setAiHint(false);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/api/ai/extract-product-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      applyExtracted(res.data);
      toast.success("Filled from your receipt - please review");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't read that file. Try a clearer image or PDF.");
    } finally {
      setAiLoading(false);
    }
  };

  const warrantyMonthsPreview =
    form.warrantyUnit === "Years"
      ? form.warrantyDuration * 12
      : form.warrantyDuration;
  const expiryPreview =
    form.purchaseDate && warrantyMonthsPreview
      ? (() => {
          const d = new Date(form.purchaseDate);
          d.setMonth(d.getMonth() + warrantyMonthsPreview);
          return d.toLocaleDateString();
        })()
      : "Not set";
  const displayName = form.name.trim() || "Unnamed product";
  const displayCategory = CategoryLabels[form.category] ?? "No category";
  const displayStore = form.store.trim() || "Store not set";

  // Live warranty status for the preview, matching the app's status colors.
  const previewStatus =
    form.purchaseDate && warrantyMonthsPreview
      ? (() => {
          const d = new Date(form.purchaseDate);
          d.setMonth(d.getMonth() + warrantyMonthsPreview);
          const days = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
          if (days < 0) return { label: "Expired", cls: "badge-expired" };
          if (days <= 30) return { label: "Expiring", cls: "badge-expiring" };
          return { label: "Active", cls: "badge-active" };
        })()
      : null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-4xl">
        <div className="nice-scroll grid max-h-[92vh] grid-cols-1 overflow-y-auto md:grid-cols-[300px_1fr] md:overflow-hidden">
          <aside className="border-b border-border bg-muted/35 p-5 md:border-b-0 md:border-r">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {isEdit ? "Edit product" : "Add product"}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-5 overflow-hidden rounded-lg border border-border bg-card">
              <div className="flex aspect-video items-center justify-center bg-muted md:aspect-square">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt={displayName}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Package className="h-14 w-14 text-muted-foreground" />
                )}
              </div>
              <div className="hidden space-y-3 p-4 md:block">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-foreground">
                      {displayName}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {displayCategory}
                    </p>
                  </div>
                  {previewStatus && (
                    <Badge
                      className={`${previewStatus.cls} shrink-0 border-0`}
                    >
                      {previewStatus.label}
                    </Badge>
                  )}
                </div>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Store className="h-4 w-4" />
                    <span className="truncate">{displayStore}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Expires {expiryPreview}</span>
                  </div>
                  {!isEdit && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ReceiptText className="h-4 w-4" />
                      <span>{docFiles.length} document{docFiles.length === 1 ? "" : "s"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => document.getElementById("imageUpload")?.click()}
              >
                <ImagePlus className="h-4 w-4" />
                Upload
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setShowImageSearch(true)}
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }
              }}
            />
            {imagePreview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 w-full text-muted-foreground"
                onClick={clearImage}
              >
                <X className="h-4 w-4" />
                Remove image
              </Button>
            )}
          </aside>

          <div className="nice-scroll p-5 md:overflow-y-auto">
            {!isEdit && (
              <>
              <section className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  <Label htmlFor="aiText">Quick fill</Label>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Describe the purchase, or scan a receipt, and we'll fill the
                  form for you to review.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="aiText"
                    placeholder="e.g. bought a MacBook last month, 3 year warranty"
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={handleAiFill}
                    disabled={aiLoading || !aiText.trim()}
                  >
                    {aiLoading ? "Thinking..." : "Fill"}
                  </Button>
                </div>
                <div className="my-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-sky-500/15" />
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    or
                  </span>
                  <div className="h-px flex-1 bg-sky-500/15" />
                </div>
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() =>
                    document.getElementById("receiptUpload")?.click()
                  }
                  className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-sky-500/40 bg-sky-500/[0.03] px-4 py-4 text-center transition-colors hover:bg-sky-500/10 disabled:opacity-60"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <ReceiptText className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    {aiLoading ? "Reading..." : "Scan a receipt or invoice"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Upload a photo or PDF and we'll read the details
                  </span>
                </button>
                <input
                  id="receiptUpload"
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleReceiptUpload(file);
                    e.target.value = "";
                  }}
                />
                {aiHint && missingFields.length > 0 && (
                  <p className="mt-3 text-sm text-amber-600">
                    Filled what I could - please complete the highlighted fields.
                  </p>
                )}
              </section>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">
                  or enter the details manually
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              </>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">Product</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Product name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g. MacBook Pro 14"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    aria-invalid={missingFields.includes("name")}
                    className={
                      missingFields.includes("name")
                        ? "border-red-500 ring-1 ring-red-500"
                        : ""
                    }
                  />
                  {missingFields.includes("name") && (
                    <p className="text-xs text-red-500">
                      Product name is required
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, category: value ?? "" }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category">
                          {CategoryLabels[form.category]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {Object.entries(CategoryLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="store">Store</Label>
                    <Input
                      id="store"
                      name="store"
                      placeholder="e.g. Amazon, KSP"
                      type="text"
                      value={form.store}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">Warranty</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">Purchase date *</Label>
                    <DatePicker
                      id="purchaseDate"
                      value={form.purchaseDate}
                      onChange={(v) =>
                        setForm((prev) => ({ ...prev, purchaseDate: v }))
                      }
                      invalid={missingFields.includes("purchaseDate")}
                    />
                    {missingFields.includes("purchaseDate") && (
                      <p className="text-xs text-red-500">
                        Purchase date is required
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Warranty duration *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="warrantyDuration"
                        name="warrantyDuration"
                        type="number"
                        required
                        min={1}
                        max={120}
                        value={form.warrantyDuration}
                        onChange={handleChange}
                        aria-invalid={missingFields.includes("warrantyDuration")}
                        className={`flex-1 ${
                          missingFields.includes("warrantyDuration")
                            ? "border-red-500 ring-1 ring-red-500"
                            : ""
                        }`}
                      />
                      <Select
                        value={form.warrantyUnit}
                        onValueChange={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            warrantyUnit: value ?? "Months",
                          }))
                        }
                      >
                        <SelectTrigger className="w-32">
                          <span>{form.warrantyUnit}</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Months">Months</SelectItem>
                          <SelectItem value="Years">Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {missingFields.includes("warrantyDuration") && (
                      <p className="text-xs text-red-500">
                        Warranty duration is required
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {!isEdit && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-foreground">
                      Documents
                    </h3>
                  </div>

                  {docFiles.length > 0 && (
                    <div className="grid gap-2">
                      {docFiles.map((doc, i) => (
                        <div
                          key={`${doc.file.name}-${i}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/35 px-3 py-2"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate text-sm text-foreground">
                              {doc.file.name}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {DocTypeLabels[doc.docType]}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openDocPreview(doc.file)}
                              aria-label="Preview document"
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                setDocFiles(docFiles.filter((_, j) => j !== i))
                              }
                              aria-label="Remove document"
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={selectedDocType}
                      onValueChange={(value) =>
                        setSelectedDocType(value ?? "OTHER")
                      }
                    >
                      <SelectTrigger className="w-44 text-sm">
                        <span>{DocTypeLabels[selectedDocType]}</span>
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
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={() =>
                        document.getElementById("docUpload")?.click()
                      }
                    >
                      <Upload className="h-4 w-4" />
                      Add document
                    </Button>
                    <input
                      id="docUpload"
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setDocFiles([
                            ...docFiles,
                            { file, docType: selectedDocType },
                          ]);
                        }
                      }}
                    />
                  </div>
                </section>
              )}

              <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/95 px-5 py-4 backdrop-blur">
                {saveError ? (
                  <p className="text-sm text-red-500">{saveError}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {isEdit ? "Update this warranty record." : "Save this product and its files."}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Save className="h-4 w-4" />
                  {loading
                    ? "Saving..."
                    : isEdit
                      ? "Update product"
                      : "Save product"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        <ImageSearchModal
          open={showImageSearch}
          onClose={() => setShowImageSearch(false)}
          initialQuery={form.name}
          onSelect={(url) => {
            setImagePreview(url);
            setForm((prev) => ({ ...prev, picture: url }));
          }}
        />

        <Dialog
          open={previewDoc !== null}
          onOpenChange={(o) => !o && closeDocPreview()}
        >
          <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-3xl">
            <DialogHeader className="border-b border-border p-4 pr-12">
              <DialogTitle className="truncate">
                {previewDoc?.name ?? "Document preview"}
              </DialogTitle>
            </DialogHeader>
            <div className="nice-scroll max-h-[calc(92vh-72px)] overflow-auto p-4">
              {previewDoc?.type.startsWith("image/") ? (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.name}
                  className="mx-auto max-h-[70vh] w-auto object-contain"
                />
              ) : previewDoc?.type === "application/pdf" ? (
                <iframe
                  title={previewDoc.name}
                  src={previewDoc.url}
                  // No sandbox: a blob: PDF can't load in an opaque-origin
                  // sandbox, and this is the user's own just-selected file.
                  className="h-[70vh] w-full rounded-lg border border-border bg-muted"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No preview available for this file type.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
