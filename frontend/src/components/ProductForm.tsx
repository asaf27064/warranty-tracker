import { useState, useEffect } from "react";
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
import { Save, Upload, Search, X } from "lucide-react";
import { Category, CategoryLabels } from "../types";
import type { Product } from "../types";
import { useProducts } from "../hooks/useProducts";
import ImageSearchModal from "./ImageSearchModal";
import api from "../api/axios";

type Props = {
  open: boolean;
  onClose: () => void;
  product?: Product; // if provided = edit mode, if not = add mode
  onSuccess: () => void;
};

const ProductForm = ({ product, open, onClose, onSuccess }: Props) => {
  const { createProduct, updateProduct } = useProducts();
  const [loading, setLoading] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const isEdit = !!product;

  const [form, setForm] = useState({
    name: "",
    category: Category.NONE as string,
    purchaseDate: "",
    warrantyDuration: 12,
    warrantyUnit: "Months",
    store: "",
    picture: "",
  });

  // Populate form when editing
  useEffect(() => {
    if (!product || !open) return;

    const months = product.warrantyMonths;
    const isYears = months >= 12 && months % 12 === 0;

    setForm({
      name: product.name,
      category: product.category,
      purchaseDate: new Date(product.purchaseDate).toISOString().split("T")[0],
      warrantyDuration: isYears ? months / 12 : months,
      warrantyUnit: isYears ? "Years" : "Months",
      store: product.store || "",
      picture: product.picture || "",
    });

    setImagePreview(product.picture || null);
    setImageFile(null);
  }, [product, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.purchaseDate || !form.warrantyDuration) return;

    const warrantyMonths =
      form.warrantyUnit === "Years"
        ? form.warrantyDuration * 12
        : form.warrantyDuration;

    let pictureUrl = form.picture;

    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      const uploadRes = await api.post("/api/images/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      pictureUrl = uploadRes.data.url;
    }

    setLoading(true);
    try {
      if (isEdit && product) {
        await updateProduct(product.id, {
          name: form.name,
          category: form.category as Category,
          purchaseDate: new Date(form.purchaseDate).toISOString(),
          warrantyMonths,
          store: form.store || undefined,
          picture: pictureUrl || undefined,
        });
      } else {
        await createProduct({
          name: form.name,
          category: form.category as Category,
          purchaseDate: new Date(form.purchaseDate).toISOString(),
          warrantyMonths,
          store: form.store || undefined,
          picture: pictureUrl || undefined,
        });
      }
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="border-zinc-800 bg-zinc-900 text-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-300">
              Product Name *
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. MacBook Pro 14"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
            />
          </div>

          {/* Category + Store */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, category: value ?? "" }))
                }
              >
                <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                  <SelectValue placeholder="Select category">
                    {CategoryLabels[form.category]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-800">
                  <SelectGroup>
                    {Object.entries(CategoryLabels).map(([value, label]) => (
                      <SelectItem
                        key={value}
                        value={value}
                        className="text-zinc-300 focus:bg-zinc-700 focus:text-white"
                      >
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="store" className="text-zinc-300">
                Store
              </Label>
              <Input
                id="store"
                name="store"
                placeholder="e.g. Amazon, KSP"
                type="text"
                value={form.store}
                onChange={handleChange}
                className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
              />
            </div>
          </div>

          {/* Purchase Date + Warranty Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate" className="text-zinc-300">
                Purchase Date *
              </Label>
              <Input
                id="purchaseDate"
                name="purchaseDate"
                type="date"
                required
                value={form.purchaseDate}
                onChange={handleChange}
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Warranty Duration *</Label>
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
                  className="flex-1 border-zinc-700 bg-zinc-800 text-white"
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
                  <SelectTrigger className="w-32 border-zinc-700 bg-zinc-800 text-white">
                    <span>{form.warrantyUnit}</span>
                  </SelectTrigger>
                  <SelectContent className="border-zinc-700 bg-zinc-800">
                    <SelectItem value="Months" className="text-zinc-300">
                      Months
                    </SelectItem>
                    <SelectItem value="Years" className="text-zinc-300">
                      Years
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Product Image */}
          <div className="space-y-3">
            <Label className="text-zinc-300">Product Image</Label>

            {imagePreview ? (
              <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-zinc-700">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setImageFile(null);
                    setForm((prev) => ({ ...prev, picture: "" }));
                  }}
                  className="absolute right-1 top-1 rounded-full bg-zinc-900/80 p-1 text-zinc-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
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
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
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

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Save className="h-4 w-4" />
              {loading
                ? "Saving..."
                : isEdit
                  ? "Update Product"
                  : "Save Product"}
            </Button>
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
