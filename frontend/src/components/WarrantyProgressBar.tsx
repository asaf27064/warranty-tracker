import type { WarrantyStatus } from "../types";

type Props = {
  purchaseDate: string;
  warrantyExpiry: string;
  status: WarrantyStatus
  showLabel?: boolean;
  barHeightClassName?: string;
};

const WarrantyProgressBar = ({
  purchaseDate,
  warrantyExpiry,
  status,
  showLabel = true,
  barHeightClassName = "h-1.5",
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

  const colorClass =
    status === "ACTIVE"
      ? "bg-emerald-500"
      : status === "EXPIRING_SOON"
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="mt-4">
      {showLabel && (
        <div className="mb-1 flex justify-between text-xs text-zinc-500">
          <span>Warranty used</span>
          <span>{percentUsed}%</span>
        </div>
      )}

      <div
        className={`w-full overflow-hidden rounded-full bg-zinc-800 ${barHeightClassName}`}
      >
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${percentUsed}%` }}
        />
      </div>
    </div>
  );
};

export default WarrantyProgressBar;