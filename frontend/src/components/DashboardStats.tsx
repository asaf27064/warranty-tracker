import { motion } from "framer-motion";
import { CircleCheck, ClockAlert, CircleX } from "lucide-react";
import type { Stats } from "../types";

type Props = {
  stats: Stats;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
};

const DashboardStats = ({ stats, statusFilter, setStatusFilter }: Props) => {
  const total =
    stats.total ?? stats.active + stats.expiringSoon + stats.expired;
  const coverage = total ? Math.round((stats.active / total) * 100) : 0;

  const items = [
    {
      key: "ACTIVE",
      label: "Active",
      count: stats.active,
      sub: `${coverage}% of all products`,
      icon: CircleCheck,
      color: "text-emerald-500",
    },
    {
      key: "EXPIRING_SOON",
      label: "Expiring soon",
      count: stats.expiringSoon,
      sub: "within 30 days",
      icon: ClockAlert,
      color: "text-amber-500",
    },
    {
      key: "EXPIRED",
      label: "Expired",
      count: stats.expired,
      sub: "needs review",
      icon: CircleX,
      color: "text-red-500",
    },
  ];

  return (
    <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((stat, i) => {
        const selected = statusFilter === stat.key;
        return (
          <motion.button
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (i + 1) }}
            onClick={() =>
              setStatusFilter(selected ? "ALL" : stat.key)
            }
            className={`rounded-xl border p-4 text-left transition-colors ${
              selected
                ? "border-foreground/20 bg-muted"
                : "border-border bg-card hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              {stat.label}
            </div>
            <div className="mt-1 text-3xl font-bold text-foreground">
              {stat.count}
            </div>
            <div className={`mt-0.5 text-xs ${stat.color}`}>{stat.sub}</div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default DashboardStats;
