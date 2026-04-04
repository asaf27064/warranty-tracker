import { motion } from "framer-motion";
import type { WarrantyStatus } from "../types";

type Props = {
  purchaseDate: string;
  warrantyExpiry: string;
  status: WarrantyStatus;
  showLabel?: boolean;
  barHeightClassName?: string;
};

const WarrantyProgressBar = ({
  purchaseDate,
  warrantyExpiry,
  status,
  showLabel = true,
  barHeightClassName = "h-2",
}: Props) => {
  const start = new Date(purchaseDate).getTime();
  const end = new Date(warrantyExpiry).getTime();
  const now = Date.now();

  let percentUsed = 0;

  if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
    const totalWarranty = end - start;
    const timeUsed = now - start;
    percentUsed = Math.max(
      0,
      Math.min(100, Math.round((timeUsed / totalWarranty) * 100)),
    );
  }

  const isFull = percentUsed >= 100;

  const colorClass =
    status === "ACTIVE"
      ? "bg-emerald-500"
      : status === "EXPIRING_SOON"
        ? "bg-amber-500"
        : "bg-red-500";

  const glowColor =
    status === "ACTIVE"
      ? "rgba(16,185,129,0.45)"
      : status === "EXPIRING_SOON"
        ? "rgba(245,158,11,0.45)"
        : "rgba(239,68,68,0.45)";

  return (
    <div className="mt-4">
      {showLabel && (
        <div className="mb-1 flex justify-between text-xs text-zinc-500">
          <span>Warranty used</span>
          <span>{percentUsed}%</span>
        </div>
      )}

      <motion.div
        animate={{
          boxShadow: isFull
            ? [
                "0 0 0px rgba(0,0,0,0)",
                `0 0 10px ${glowColor}`,
                "0 0 0px rgba(0,0,0,0)",
              ]
            : "0 0 0px rgba(0,0,0,0)",
        }}
        transition={{
          boxShadow: isFull
            ? {
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
              }
            : { duration: 0.2 },
        }}
        className="rounded-full"
      >
        <div
          className={`w-full overflow-hidden rounded-full bg-zinc-800 ${barHeightClassName}`}
        >
          <motion.div
            className={`h-full rounded-full ${colorClass}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentUsed}%` }}
            transition={{ width: { duration: 0.8, ease: "easeOut" } }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default WarrantyProgressBar;
