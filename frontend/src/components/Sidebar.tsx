import {
  LayoutGrid,
  CircleCheck,
  ClockAlert,
  CircleX,
  Sparkles,
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
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { CategoryLabels, type Stats } from "../types";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  stats: Stats;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  onOpenChat: () => void;
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

const Sidebar = ({
  collapsed,
  onToggle,
  stats,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  onOpenChat,
}: Props) => {
  const views = [
    { key: "ALL", label: "All products", icon: LayoutGrid, count: stats.total ?? 0, color: "" },
    { key: "ACTIVE", label: "Active", icon: CircleCheck, count: stats.active, color: "c-active" },
    { key: "EXPIRING_SOON", label: "Expiring soon", icon: ClockAlert, count: stats.expiringSoon, color: "c-expiring" },
    { key: "EXPIRED", label: "Expired", icon: CircleX, count: stats.expired, color: "c-expired" },
  ];

  const byCategory = stats.byCategory ?? {};
  const categories = Object.keys(CategoryLabels).filter(
    (c) => (byCategory[c] ?? 0) > 0,
  );

  const Item = ({
    active,
    onClick,
    Icon,
    iconColor,
    label,
    count,
  }: {
    active: boolean;
    onClick: () => void;
    Icon: LucideIcon;
    iconColor?: string;
    label: string;
    count?: number;
  }) => (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
        collapsed ? "justify-center" : ""
      } ${
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/60"
      }`}
    >
      <Icon className={`h-[18px] w-[18px] shrink-0 ${iconColor ?? ""}`} />
      {!collapsed && (
        <>
          <span className="truncate">{label}</span>
          {count !== undefined && (
            <span className="ml-auto text-xs text-muted-foreground">{count}</span>
          )}
        </>
      )}
    </button>
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-56 shrink-0 flex-col overflow-hidden border-r border-border bg-card p-3 transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:bg-card/40 md:transition-[width] ${
        collapsed ? "-translate-x-full md:w-[60px]" : "translate-x-0 md:w-56"
      }`}
    >
      <div
        className={`mb-1 hidden md:flex ${collapsed ? "justify-center" : "justify-end"}`}
      >
        <button
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          ) : (
            <PanelLeftClose className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>
      {!collapsed && (
        <p className="mb-1 px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          Views
        </p>
      )}
      <nav className="flex flex-col gap-0.5">
        {views.map((v) => (
          <Item
            key={v.key}
            active={statusFilter === v.key}
            onClick={() => setStatusFilter(v.key)}
            Icon={v.icon}
            iconColor={v.color}
            label={v.label}
            count={v.count}
          />
        ))}
      </nav>

      <div className="nice-scroll -mx-1 mt-2 flex-1 overflow-y-auto px-1">
      {categories.length > 0 && (
        <>
          {!collapsed && (
            <p className="mb-1 mt-4 px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              Categories
            </p>
          )}
          {collapsed && <div className="my-3 border-t border-border" />}
          <nav className="flex flex-col gap-0.5">
            <Item
              active={categoryFilter === "ALL"}
              onClick={() => setCategoryFilter("ALL")}
              Icon={LayoutGrid}
              label="All categories"
            />
            {categories.map((c) => (
              <Item
                key={c}
                active={categoryFilter === c}
                onClick={() =>
                  setCategoryFilter(categoryFilter === c ? "ALL" : c)
                }
                Icon={categoryIcons[c] ?? Package}
                label={CategoryLabels[c]}
                count={byCategory[c]}
              />
            ))}
          </nav>
        </>
      )}
      </div>

      <div className="mt-3 shrink-0 border-t border-border pt-3">
        <button
          onClick={onOpenChat}
          title={collapsed ? "Ask assistant" : undefined}
          className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-sky-600 transition-colors hover:bg-sky-500/10 dark:text-sky-400 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Sparkles className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Ask assistant</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
