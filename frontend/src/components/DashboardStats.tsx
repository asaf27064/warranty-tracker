import { ShieldCheck, AlertTriangle, CalendarClock } from "lucide-react";
import type { Stats } from "../types";

type Props = {
  stats: Stats;
  onSelectStatus?: (status: string) => void;
};

const formatUntil = (days: number) => {
  if (days <= 0) return "Today";
  if (days < 45) return `${days} day${days === 1 ? "" : "s"}`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return `${months} month${months === 1 ? "" : "s"}`;
  }
  const years = days / 365;
  const value = years < 2 ? Number(years.toFixed(1)) : Math.round(years);
  return `${value} year${value === 1 ? "" : "s"}`;
};

const DashboardStats = ({ stats, onSelectStatus }: Props) => {
  const total =
    stats.total ?? stats.active + stats.expiringSoon + stats.expired;
  const coverage = total ? Math.round((stats.active / total) * 100) : 0;
  const attention = stats.expiringSoon + stats.expired;

  const next = stats.nextExpiry ?? null;
  const nextDays = next
    ? Math.ceil((new Date(next.date).getTime() - Date.now()) / 86_400_000)
    : null;

  const cardClass =
    "rounded-xl border border-border bg-card p-5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 enabled:cursor-pointer enabled:hover:border-emerald-600/40 enabled:hover:bg-muted/30 disabled:cursor-default";

  return (
    <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <button
        type="button"
        onClick={() => onSelectStatus?.("ACTIVE")}
        className={cardClass}
      >
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <ShieldCheck className="h-4 w-4 c-active" />
          Coverage
        </div>
        <div className="mt-1.5 text-3xl font-bold text-foreground">
          {coverage}%
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {stats.active} of {total} active
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bar-active" style={{ width: `${coverage}%` }} />
        </div>
      </button>

      <button
        type="button"
        disabled={attention === 0}
        onClick={() => onSelectStatus?.("ATTENTION")}
        className={cardClass}
      >
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <AlertTriangle className="h-4 w-4 c-expiring" />
          Needs attention
        </div>
        <div className="mt-1.5 text-3xl font-bold text-foreground">
          {attention}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          <span className="c-expiring">{stats.expiringSoon} expiring</span>
          {" · "}
          <span className="c-expired">{stats.expired} expired</span>
        </div>
      </button>

      <button
        type="button"
        disabled={!next}
        onClick={() => onSelectStatus?.("EXPIRING_SOON")}
        className={cardClass}
      >
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <CalendarClock className="h-4 w-4" />
          Next expiry
        </div>
        <div className="mt-1.5 text-3xl font-bold text-foreground">
          {nextDays === null ? "None" : formatUntil(nextDays)}
        </div>
        <div className="mt-1 truncate text-xs text-muted-foreground">
          {next
            ? `${next.name}${next.count > 1 ? ` +${next.count - 1} more` : ""} · ${new Date(next.date).toLocaleDateString()}`
            : "Nothing upcoming"}
        </div>
      </button>
    </div>
  );
};

export default DashboardStats;
