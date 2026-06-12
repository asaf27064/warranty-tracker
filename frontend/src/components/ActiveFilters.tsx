import { X } from "lucide-react";
import { CategoryLabels, StatusLabels } from "../types";

type Props = {
  search: string;
  status: string;
  category: string;
  onClearSearch: () => void;
  onClearStatus: () => void;
  onClearCategory: () => void;
  onClearAll: () => void;
};

const Chip = ({
  label,
  value,
  onClear,
}: {
  label: string;
  value: string;
  onClear: () => void;
}) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 py-1 pl-2.5 pr-1.5 text-xs">
    <span className="text-muted-foreground">{label}:</span>
    <span className="font-medium text-foreground">{value}</span>
    <button
      type="button"
      onClick={onClear}
      aria-label={`Clear ${label} filter`}
      className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <X className="h-3 w-3" />
    </button>
  </span>
);

const ActiveFilters = ({
  search,
  status,
  category,
  onClearSearch,
  onClearStatus,
  onClearCategory,
  onClearAll,
}: Props) => {
  const hasSearch = search.trim() !== "";
  const hasStatus = status !== "ALL";
  const hasCategory = category !== "ALL";

  if (!hasSearch && !hasStatus && !hasCategory) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Filters:</span>
      {hasSearch && (
        <Chip label="Search" value={`"${search}"`} onClear={onClearSearch} />
      )}
      {hasStatus && (
        <Chip
          label="Status"
          value={StatusLabels[status] ?? status}
          onClear={onClearStatus}
        />
      )}
      {hasCategory && (
        <Chip
          label="Category"
          value={CategoryLabels[category] ?? category}
          onClear={onClearCategory}
        />
      )}
      <button
        type="button"
        onClick={onClearAll}
        className="ml-1 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Clear all
      </button>
    </div>
  );
};

export default ActiveFilters;
