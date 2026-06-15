import { ShieldCheck, AlertTriangle, CalendarClock } from "lucide-react";
import type { Stats } from "../types";

type Props = {
  stats: Stats;
};

const formatUntil = (days: number) => {
  if (days <= 0) return "Today";
  if (days < 45) return `${days} day${days === 1 ? "" : "s"}`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  const years = days / 365;
  return `${years < 2 ? years.toFixed(1) : Math.round(years)} years`;
};

const DashboardStats = ({ stats }: Props) => {
  const total =
    stats.total ?? stats.active + stats.expiringSoon + stats.expired;
  const coverage = total ? Math.round((stats.active / total) * 100) : 0;
  const attention = stats.expiringSoon + stats.expired;

  const next = stats.nextExpiry ?? null;
  const nextDays = next
    ? Math.ceil((new Date(next.date).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 c-active" />
          Coverage
        </div>
        <div className="mt-1 text-3xl font-bold text-foreground">{coverage}%</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {stats.active} of {total} active
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bar-active" style={{ width: `${coverage}%` }} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 c-expiring" />
          Needs attention
        </div>
        <div className="mt-1 text-3xl font-bold text-foreground">{attention}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          <span className="c-expiring">{stats.expiringSoon} expiring</span>
          {" · "}
          <span className="c-expired">{stats.expired} expired</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarClock className="h-4 w-4" />
          Next expiry
        </div>
        <div className="mt-1 text-3xl font-bold text-foreground">
          {nextDays === null ? "—" : formatUntil(nextDays)}
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {next
            ? `${next.name}${next.count > 1 ? ` +${next.count - 1} more` : ""} · ${new Date(next.date).toLocaleDateString()}`
            : "Nothing upcoming"}
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
