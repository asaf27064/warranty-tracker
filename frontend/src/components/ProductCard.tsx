import { CategoryLabels, type Product } from "../types/index";
import {
  Package,
  Calendar,
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
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import WarrantyProgressBar from "./WarrantyProgressBar";
import ProductImage from "./ProductImage";
import { motion } from "framer-motion";

type Props = {
  product: Product;
  onClick: () => void;
  selectable?: boolean;
  selected?: boolean;
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

const timeLeft = (expiry: string): string => {
  const days = Math.ceil(
    (new Date(expiry).getTime() - Date.now()) / 86_400_000,
  );
  if (days < 0) {
    const a = Math.abs(days);
    if (a < 30) return `Expired ${a}d ago`;
    if (a < 365) return `Expired ${Math.floor(a / 30)}mo ago`;
    return `Expired ${Math.floor(a / 365)}y ago`;
  }
  if (days === 0) return "Expires today";
  if (days < 60) return `${days} day${days === 1 ? "" : "s"} left`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return `${months} month${months === 1 ? "" : "s"} left`;
  }
  const years = days / 365;
  const value = years < 2 ? Number(years.toFixed(1)) : Math.round(years);
  return `${value} year${value === 1 ? "" : "s"} left`;
};

const ProductCard = ({ product, onClick, selectable, selected }: Props) => {
  const statusConfig = {
    ACTIVE: { color: "badge-active", label: "Active" },
    EXPIRING_SOON: { color: "badge-expiring", label: "Expiring" },
    EXPIRED: { color: "badge-expired", label: "Expired" },
  };

  const status = statusConfig[product.status as keyof typeof statusConfig];
  const CategoryIcon = categoryIcons[product.category] ?? Package;

  const timeLeftColor = {
    ACTIVE: "c-active",
    EXPIRING_SOON: "c-expiring",
    EXPIRED: "c-expired",
  }[product.status as "ACTIVE" | "EXPIRING_SOON" | "EXPIRED"];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -3 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="group"
    >
      <Card
        role="button"
        tabIndex={0}
        aria-label={product.name}
        className={`relative flex flex-col gap-0 cursor-pointer overflow-hidden border-border bg-card p-0 transition-all hover:shadow-xl ${
          selected ? "ring-2 ring-emerald-500" : ""
        }`}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <div className="relative flex h-44 items-center justify-center overflow-hidden bg-muted p-1.5">
          {selectable && (
            <input
              type="checkbox"
              checked={!!selected}
              readOnly
              aria-label={`Select ${product.name}`}
              className="pointer-events-none absolute left-3 top-3 z-10 h-4 w-4 accent-emerald-600"
            />
          )}
          <ProductImage
            src={product.picture}
            alt={product.name}
            className="h-full w-full rounded-lg object-cover"
            fallback={<CategoryIcon className="h-16 w-16 text-muted-foreground" />}
          />
          <Badge
            className={`absolute right-3 top-3 z-10 border-0 bg-background/85 shadow-sm backdrop-blur-sm ${timeLeftColor}`}
          >
            {status.label}
          </Badge>
        </div>

        <div className="min-w-0 p-4">
          <h3 className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-emerald-500">
            {product.name}
          </h3>

          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {CategoryLabels[product.category] || product.category}
            {product.store ? ` · ${product.store}` : ""}
          </p>

          <div className="mt-3 flex items-center justify-between gap-2 text-sm">
            <span
              className="flex items-center gap-1.5 text-muted-foreground"
              title={`Warranty expires ${new Date(
                product.warrantyExpiry,
              ).toLocaleDateString()}`}
            >
              <Calendar className="h-3.5 w-3.5" />
              {new Date(product.warrantyExpiry).toLocaleDateString(undefined, {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
            <span className={`font-medium ${timeLeftColor}`}>
              {timeLeft(product.warrantyExpiry)}
            </span>
          </div>

          <WarrantyProgressBar
            purchaseDate={product.purchaseDate}
            warrantyExpiry={product.warrantyExpiry}
            status={product.status}
            showLabel={false}
            barHeightClassName="h-1.5"
          />
        </div>
      </Card>
    </motion.div>
  );
};

export default ProductCard;
