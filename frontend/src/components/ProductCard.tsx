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
import { motion } from "framer-motion";

type Props = {
  product: Product;
  onClick: () => void;
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
  if (days < 60) return `${days} days left`;
  if (days < 365) return `~${Math.round(days / 30)} months left`;
  const years = days / 365;
  return `~${years < 2 ? years.toFixed(1) : Math.round(years)} years left`;
};

const ProductCard = ({ product, onClick }: Props) => {
  const statusConfig = {
    ACTIVE: { color: "bg-emerald-500/10 text-emerald-500", label: "Active" },
    EXPIRING_SOON: {
      color: "bg-amber-500/10 text-amber-500",
      label: "Expiring",
    },
    EXPIRED: { color: "bg-red-500/10 text-red-500", label: "Expired" },
  };

  const status = statusConfig[product.status as keyof typeof statusConfig];
  const CategoryIcon = categoryIcons[product.category] ?? Package;

  const timeLeftColor = {
    ACTIVE: "text-emerald-500",
    EXPIRING_SOON: "text-amber-500",
    EXPIRED: "text-red-500",
  }[product.status as "ACTIVE" | "EXPIRING_SOON" | "EXPIRED"];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -3 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="group"
    >
      <Card
        className="flex flex-row gap-0 cursor-pointer overflow-hidden border-border bg-card p-0 transition-all hover:shadow-xl"
        onClick={onClick}
      >
        <div className="flex w-24 shrink-0 items-center justify-center bg-muted p-2">
          {product.picture ? (
            <img
              src={product.picture}
              alt={product.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <CategoryIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-emerald-500">
              {product.name}
            </h3>
            <Badge className={`${status.color} shrink-0 border-0`}>
              {status.label}
            </Badge>
          </div>

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
