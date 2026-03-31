import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Search } from "lucide-react";
import { CategoryLabels } from "../types";

const sortLabels: Record<string, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  expiring: "Expiring soon",
  name: "Name A-Z",
};

type Props = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
};

const ProductFilters = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  sortBy,
  setSortBy,
}: Props) => {
  const filters = [
    { key: "ALL", label: "All" },
    { key: "ACTIVE", label: "Active" },
    { key: "EXPIRING_SOON", label: "Expiring" },
    { key: "EXPIRED", label: "Expired" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-zinc-800 bg-zinc-900 pl-10 text-white placeholder:text-zinc-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === f.key
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {/* Category filter */}
        <Select
          value={categoryFilter}
          onValueChange={(value) => setCategoryFilter(value ?? "ALL")}
        >
          <SelectTrigger className="w-40 border-zinc-800 bg-zinc-900 text-sm text-white">
            <SelectValue>
              {categoryFilter === "ALL"
                ? "All Categories"
                : CategoryLabels[categoryFilter]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="border-zinc-700 bg-zinc-800">
            <SelectItem value="ALL" className="text-zinc-300">
              All Categories
            </SelectItem>
            {Object.entries(CategoryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-zinc-300">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value ?? "newest")}
        >
          <SelectTrigger className="w-40 border-zinc-800 bg-zinc-900 text-sm text-white">
            <SelectValue>{sortLabels[sortBy]}</SelectValue>
          </SelectTrigger>
          <SelectContent className="border-zinc-700 bg-zinc-800">
            {Object.entries(sortLabels).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-zinc-300">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ProductFilters;
