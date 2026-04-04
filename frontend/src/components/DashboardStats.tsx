import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, ShieldX } from "lucide-react";
import { Card } from "./ui/card";

type Props = {
  stats: { active: number; expiringSoon: number; expired: number };
  statusFilter: string;
  setStatusFilter: (value: string) => void;
};

const DashboardStats = ({ stats, statusFilter, setStatusFilter }: Props) => {
  const items = [
    {
      icon: ShieldCheck,
      count: stats.active,
      label: "Active",
      key: "ACTIVE",
      bg: "bg-emerald-500/10",
      text: "text-emerald-500",
      delay: 0.1,
    },
    {
      icon: AlertTriangle,
      count: stats.expiringSoon,
      label: "Expiring Soon",
      key: "EXPIRING_SOON",
      bg: "bg-amber-500/10",
      text: "text-amber-500",
      delay: 0.2,
    },
    {
      icon: ShieldX,
      count: stats.expired,
      label: "Expired",
      key: "EXPIRED",
      bg: "bg-red-500/10",
      text: "text-red-500",
      delay: 0.3,
    },
  ];
  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((stat) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: stat.delay }}
        >
          <Card
            onClick={() =>
              setStatusFilter(statusFilter === stat.key ? "ALL" : stat.key)
            }
            className={`cursor-pointer border-zinc-800 bg-zinc-900 p-6 transition-all ${
              statusFilter === stat.key
                ? "ring-1 ring-emerald-500 border-emerald-500"
                : "hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`rounded-xl ${stat.bg} p-3`}>
                <stat.icon className={`h-6 w-6 ${stat.text}`} />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stat.count}</p>
                <p className="text-sm text-zinc-400">{stat.label}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default DashboardStats;
