import { CategoryLabels, type Product } from "../types";
import {
  Package,
  ArrowUp,
  ArrowDown,
  Laptop,
  Smartphone,
  Gem,
  ToyBrick,
  WashingMachine,
  Sofa,
  Shirt,
  Car,
  Dumbbell,
  Wrench,
  CookingPot,
  type LucideIcon,
} from "lucide-react";
import WarrantyProgressBar from "./WarrantyProgressBar";

type Props = {
  products: Product[];
  sortField: string;
  sortDir: string;
  onSort: (field: string) => void;
  onRowClick: (p: Product) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  allSelected?: boolean;
  onToggleSelectAll?: () => void;
};

const categoryIcons: Record<string, LucideIcon> = {
  ELECTRONICS: Laptop,
  HOME_KITCHEN: CookingPot,
  PHONES: Smartphone,
  JEWELRY: Gem,
  KIDS_TOYS: ToyBrick,
  APPLIANCES: WashingMachine,
  FURNITURE: Sofa,
  FASHION: Shirt,
  AUTOMOTIVE: Car,
  SPORTS: Dumbbell,
  TOOLS: Wrench,
};

const timeLeftColor: Record<string, string> = {
  ACTIVE: "c-active",
  EXPIRING_SOON: "c-expiring",
  EXPIRED: "c-expired",
};

const timeLeft = (expiry: string): string => {
  const days = Math.ceil(
    (new Date(expiry).getTime() - Date.now()) / 86_400_000,
  );
  if (days < 0) return "Expired";
  if (days === 0) return "Today";
  if (days < 60) return `${days}d left`;
  if (days < 365) return `~${Math.round(days / 30)}mo left`;
  return `~${Math.round(days / 365)}y left`;
};

const ProductList = ({
  products,
  sortField,
  sortDir,
  onSort,
  onRowClick,
  selectable,
  selectedIds,
  allSelected,
  onToggleSelectAll,
}: Props) => {
  const Header = ({
    label,
    sortKey,
    className,
  }: {
    label: string;
    sortKey: string;
    className?: string;
  }) => {
    const active = sortField === sortKey;
    return (
      <button
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1 text-left transition-colors hover:text-foreground ${
          active ? "text-foreground" : ""
        } ${className ?? ""}`}
      >
        {label}
        {active &&
          (sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          ))}
      </button>
    );
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {selectable && (
          <input
            type="checkbox"
            checked={!!allSelected}
            onChange={onToggleSelectAll}
            aria-label="Select all"
            className="h-4 w-4 shrink-0 accent-emerald-600"
          />
        )}
        <Header label="Product" sortKey="name" className="flex-1" />
        <Header label="Store" sortKey="store" className="hidden w-28 lg:flex" />
        <Header
          label="Category"
          sortKey="category"
          className="hidden w-28 md:flex"
        />
        <Header
          label="Expiry"
          sortKey="expiry"
          className="hidden w-24 sm:flex"
        />
        <span className="hidden w-16 xl:block">Used</span>
        <span className="w-24 text-right">Time left</span>
      </div>

      {products.map((p) => {
        const Icon = categoryIcons[p.category] ?? Package;
        return (
          <button
            key={p.id}
            onClick={() => onRowClick(p)}
            className={`flex w-full items-center gap-3 border-b border-border px-4 py-2.5 text-left text-sm transition-colors last:border-b-0 hover:bg-muted/50 ${
              selectable && selectedIds?.has(p.id) ? "bg-emerald-500/10" : ""
            }`}
          >
            {selectable && (
              <input
                type="checkbox"
                checked={selectedIds?.has(p.id) ?? false}
                readOnly
                tabIndex={-1}
                aria-hidden="true"
                className="pointer-events-none h-4 w-4 shrink-0 accent-emerald-600"
              />
            )}
            <span className="flex min-w-0 flex-1 items-center gap-2.5">
              {p.picture ? (
                <img
                  src={p.picture}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-md bg-muted object-contain"
                />
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </span>
              )}
              <span className="truncate font-medium text-foreground">
                {p.name}
              </span>
            </span>
            <span className="hidden w-28 truncate text-muted-foreground lg:block">
              {p.store || "—"}
            </span>
            <span className="hidden w-28 truncate text-muted-foreground md:block">
              {CategoryLabels[p.category] || p.category}
            </span>
            <span className="hidden w-24 text-muted-foreground sm:block">
              {new Date(p.warrantyExpiry).toLocaleDateString(undefined, {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })}
            </span>
            <span className="hidden w-16 xl:block">
              <WarrantyProgressBar
                purchaseDate={p.purchaseDate}
                warrantyExpiry={p.warrantyExpiry}
                status={p.status}
                showLabel={false}
                barHeightClassName="h-1.5"
                containerClassName=""
              />
            </span>
            <span
              className={`w-24 text-right font-medium ${timeLeftColor[p.status]}`}
            >
              {timeLeft(p.warrantyExpiry)}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ProductList;
