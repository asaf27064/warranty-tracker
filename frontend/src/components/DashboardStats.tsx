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
    "rounded-lg border border-border bg-card px-3.5 py-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 enabled:cursor-pointer enabled:hover:border-emerald-600/40 enabled:hover:bg-muted/30 disabled:cursor-default";

  return (
    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <button
        type="button"
        onClick={() => onSelectStatus?.("ACTIVE")}
        className={cardClass}
      >
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 c-active" />
          Coverage
        </div>
        <div className="mt-0.5 text-2xl font-bold text-foreground">
          {coverage}%
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          {stats.active} of {total} active
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full bar-active" style={{ width: `${coverage}%` }} />
        </div>
      </button>

      <button
        type="button"
        disabled={attention === 0}
        onClick={() => onSelectStatus?.("ATTENTION")}
        className={cardClass}
      >
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5 c-expiring" />
          Needs attention
        </div>
        <div className="mt-0.5 text-2xl font-bold text-foreground">
          {attention}
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
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
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5" />
          Next expiry
        </div>
        <div className="mt-0.5 text-2xl font-bold text-foreground">
          {nextDays === null ? "None" : formatUntil(nextDays)}
        </div>
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {next
            ? `${next.name}${next.count > 1 ? ` +${next.count - 1} more` : ""} · ${new Date(next.date).toLocaleDateString()}`
            : "Nothing upcoming"}
        </div>
      </button>
    </div>
  );
};

export default DashboardStats;
