import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../hooks/useNotifications";

const ReminderToaster = () => {
  const { user } = useAuth();
  const { reminders } = useNotifications();
  const navigate = useNavigate();
  const seen = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  useEffect(() => {
    if (!primed.current) {
      reminders.forEach((r) => seen.current.add(r.id));
      primed.current = true;
      return;
    }

    for (const r of reminders) {
      if (seen.current.has(r.id)) continue;
      seen.current.add(r.id);
      if (r.isRead || !user?.inAppNotifications) continue;

      const days = Math.ceil(
        (new Date(r.product.warrantyExpiry).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      );
      const when =
        days > 0
          ? `expires in ${days} day${days === 1 ? "" : "s"}`
          : days === 0
            ? "expires today"
            : `expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;

      toast(`${r.product?.name ?? "A product"} warranty ${when}`, {
        action: {
          label: "View",
          onClick: () => navigate(`/product/${r.productId}`),
        },
      });
    }
  }, [reminders, user, navigate]);

  return null;
};

export default ReminderToaster;
