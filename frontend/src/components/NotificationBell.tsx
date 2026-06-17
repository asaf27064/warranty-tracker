import { Bell, Check, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useNotifications } from "../hooks/useNotifications";
import ProductImage from "./ProductImage";
import { useState } from "react";

const NotificationBell = () => {
  const { notifications, unreadCount, markGroupRead, markAllRead, clearAll } =
    useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleClick = async (reminderIds: string[], productId: string) => {
    await markGroupRead(reminderIds);
    setOpen(false);
    navigate(`/product/${productId}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="Notifications"
        className="relative rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Notifications
            </h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread`
                : "You're all caught up"}
            </p>
          </div>
          {notifications.length > 0 && (
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  title="Mark all as read"
                  aria-label="Mark all as read"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={clearAll}
                title="Clear notifications"
                aria-label="Clear notifications"
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="nice-scroll max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <Bell className="mb-2 h-8 w-8" />
              <p className="text-sm">No reminders yet</p>
            </div>
          ) : (
            notifications.map((n) => {
              const daysUntil = Math.ceil(
                (new Date(n.product.warrantyExpiry).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24),
              );
              const rel =
                daysUntil > 0
                  ? `Warranty expires in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`
                  : daysUntil === 0
                    ? "Warranty expires today"
                    : `Warranty expired ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? "" : "s"} ago`;
              const dateLabel = `${daysUntil < 0 ? "Expired" : "Expires"} on ${new Date(n.product.warrantyExpiry).toLocaleDateString()}`;

              return (
                <button
                  key={n.productId}
                  onClick={() => handleClick(n.reminderIds, n.productId)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                    !n.isRead ? "bg-muted/30" : ""
                  }`}
                >
                  <div className="mt-1.5 shrink-0">
                    {!n.isRead ? (
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    ) : (
                      <div className="h-2 w-2" />
                    )}
                  </div>

                  <ProductImage
                    src={n.product?.picture}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-md object-cover"
                    fallback={
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                      </div>
                    }
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {n.product?.name || "Product"}
                    </p>
                    <p className="text-xs text-muted-foreground">{rel}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {dateLabel}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
