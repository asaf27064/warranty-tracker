import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search, Loader2 } from "lucide-react";
import api from "../api/axios";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  initialQuery?: string;
};

const ImageSearchModal = ({
  open,
  onClose,
  onSelect,
  initialQuery = "",
}: Props) => {
  const [query, setQuery] = useState(initialQuery);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await api.get("/api/images/search", {
        params: { q: query },
      });
      setImages(res.data.images);
    } catch {
      setImages([]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-zinc-800 bg-zinc-900 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Search Product Image</DialogTitle>
        </DialogHeader>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search for product images..."
              className="border-zinc-700 bg-zinc-800 pl-10 text-white placeholder:text-zinc-500"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        )}

        {/* Image grid */}
        {!loading && images.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {images.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onSelect(url);
                  onClose();
                }}
                className="overflow-hidden rounded-lg border border-zinc-700 transition-all hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10"
              >
                <img src={url} alt="" className="h-32 w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && images.length === 0 && query && (
          <div className="py-8 text-center text-zinc-500">No images found</div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageSearchModal;
