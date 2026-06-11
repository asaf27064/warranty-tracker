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
import { Save, Upload, Search, X, FileText } from "lucide-react";
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
      toast.success("Filled from your receipt — please review");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't read that file. Try a clearer image or PDF.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        {!isEdit && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
            <Label htmlFor="aiText">✨ Quick add with AI</Label>
            <div className="flex gap-2">
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

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">or</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={aiLoading}
                onClick={() =>
                  document.getElementById("receiptUpload")?.click()
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                Upload receipt / invoice
              </Button>
              <span className="text-xs text-muted-foreground">image or PDF</span>
              <input
                id="receiptUpload"
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleReceiptUpload(file);
                  e.target.value = ""; // allow re-selecting the same file
                }}
              />
            </div>

            {aiHint && missingFields.length > 0 && (
              <p className="text-sm text-amber-600">
                Filled what I could — please complete the highlighted fields.
              </p>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. MacBook Pro 14"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className={
                missingFields.includes("name")
                  ? "border-amber-500 ring-1 ring-amber-500"
                  : ""
              }
            />
          </div>

          {/* Category + Store */}
          <div className="grid grid-cols-2 gap-4">
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

          {/* Purchase Date + Warranty Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date *</Label>
              <Input
                id="purchaseDate"
                name="purchaseDate"
                type="date"
                required
                value={form.purchaseDate}
                onChange={handleChange}
                className={
                  missingFields.includes("purchaseDate")
                    ? "border-amber-500 ring-1 ring-amber-500"
                    : ""
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Warranty Duration *</Label>
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
                  className={`flex-1 ${
                    missingFields.includes("warrantyDuration")
                      ? "border-amber-500 ring-1 ring-amber-500"
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
            </div>
          </div>

          {/* Product Image */}
          <div className="space-y-3">
            <Label>Product Image</Label>

            {imagePreview ? (
              <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-border">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute right-1 top-1 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.getElementById("imageUpload")?.click()
                  }
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowImageSearch(true)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
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
              </div>
            )}
          </div>

          {/* Documents */}
          {!isEdit && (
            <div className="space-y-3">
              <Label>Documents</Label>

              {docFiles.length > 0 && (
                <div className="flex flex-col gap-2">
                  {docFiles.map((doc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          {doc.file.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {DocTypeLabels[doc.docType]}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setDocFiles(docFiles.filter((_, j) => j !== i))
                        }
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Select
                  value={selectedDocType}
                  onValueChange={(value) =>
                    setSelectedDocType(value ?? "OTHER")
                  }
                >
                  <SelectTrigger className="w-40 text-sm">
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
                  onClick={() => document.getElementById("docUpload")?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Add Document
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
            </div>
          )}

          {/* Submit */}
          <div className="space-y-2 pt-2">
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Save className="h-4 w-4" />
                {loading
                  ? "Saving..."
                  : isEdit
                    ? "Update Product"
                    : "Save Product"}
              </Button>
            </div>
            {saveError && (
              <p className="text-sm text-red-500">{saveError}</p>
            )}
          </div>
        </form>

        <ImageSearchModal
          open={showImageSearch}
          onClose={() => setShowImageSearch(false)}
          initialQuery={form.name}
          onSelect={(url) => {
            setImagePreview(url);
            setForm((prev) => ({ ...prev, picture: url }));
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
