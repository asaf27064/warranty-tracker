import { CategoryLabels, type Product } from "../types/index";
import { Package, Store, Calendar } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import WarrantyProgressBar from "./WarrantyProgressBar";
import { motion } from "framer-motion";

type Props = {
  product: Product;
  onClick: () => void;
};

const ProductCard = ({ product, onClick }: Props) => {
  const statusConfig = {
    ACTIVE: { color: "bg-emerald-500/10 text-emerald-500", label: "Active" },
    EXPIRING_SOON: {
      color: "bg-amber-500/10 text-amber-500",
      label: "Expiring Soon",
    },
    EXPIRED: { color: "bg-red-500/10 text-red-500", label: "Expired" },
  };

  const status = statusConfig[product.status as keyof typeof statusConfig];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -3 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="group"
    >
      <Card
        className="cursor-pointer border-border bg-card p-5 transition-all hover:shadow-xl"
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            {product.picture ? (
              <img
                src={product.picture}
                alt={product.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <Package className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          <Badge className={`${status.color} border-0`}>{status.label}</Badge>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-semibold text-foreground transition-colors group-hover:text-emerald-500">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {CategoryLabels[product.category] || product.category}
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="h-3.5 w-3.5" />
            <span>{product.store}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Expires {new Date(product.warrantyExpiry).toLocaleDateString()}
            </span>
          </div>
        </div>

        <WarrantyProgressBar
          purchaseDate={product.purchaseDate}
          warrantyExpiry={product.warrantyExpiry}
          status={product.status}
        />
      </Card>
    </motion.div>
  );
};

export default ProductCard;