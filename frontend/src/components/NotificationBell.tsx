import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useNotifications } from "../hooks/useNotifications";
import { useState } from "react";

const NotificationBell = () => {
  const { reminders, unreadCount, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleClick = async (reminderId: string, productId: string) => {
    await markAsRead(reminderId);
    setOpen(false);
    navigate(`/product/${productId}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="relative rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Notifications
          </h3>
          <p className="text-xs text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread reminder${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto">
          {reminders.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <Bell className="mb-2 h-8 w-8" />
              <p className="text-sm">No reminders yet</p>
            </div>
          ) : (
            reminders.map((reminder) => {
              const daysUntil = Math.ceil(
                (new Date(reminder.product.warrantyExpiry).getTime() -
                  Date.now()) /
                  (1000 * 60 * 60 * 24),
              );

              return (
                <button
                  key={reminder.id}
                  onClick={() => handleClick(reminder.id, reminder.productId)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                    !reminder.isRead ? "bg-muted/30" : ""
                  }`}
                >
                  {/* Unread dot */}
                  <div className="mt-1.5 shrink-0">
                    {!reminder.isRead ? (
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    ) : (
                      <div className="h-2 w-2" />
                    )}
                  </div>

                  {/* Product image */}
                  {reminder.product?.picture ? (
                    <img
                      src={reminder.product.picture}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {reminder.product?.name || "Product"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {daysUntil > 0
                        ? `Warranty expires in ${daysUntil} days`
                        : daysUntil === 0
                          ? "Warranty expires today"
                          : `Warranty expired ${Math.abs(daysUntil)} days ago`}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Expires in{" "}
                      {new Date(
                        reminder.product.warrantyExpiry,
                      ).toLocaleDateString()}
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
