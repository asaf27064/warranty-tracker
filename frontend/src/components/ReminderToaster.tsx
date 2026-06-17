import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../hooks/useNotifications";

const ReminderToaster = () => {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const seen = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  useEffect(() => {
    if (!primed.current) {
      notifications.forEach((n) => seen.current.add(n.productId));
      primed.current = true;
      return;
    }

    for (const n of notifications) {
      if (seen.current.has(n.productId)) continue;
      seen.current.add(n.productId);
      if (n.isRead || !user?.inAppNotifications) continue;

      const days = Math.ceil(
        (new Date(n.product.warrantyExpiry).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      );
      const when =
        days > 0
          ? `expires in ${days} day${days === 1 ? "" : "s"}`
          : days === 0
            ? "expires today"
            : `expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;

      toast(`${n.product?.name ?? "A product"} warranty ${when}`, {
        action: {
          label: "View",
          onClick: () => navigate(`/product/${n.productId}`),
        },
      });
    }
  }, [notifications, user, navigate]);

  return null;
};

export default ReminderToaster;
