import { useState, type ComponentType } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Bell, Mail, Smartphone } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { enablePush, disablePush, pushSupported } from "../lib/push";
import { toast } from "sonner";

type RowProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  checked?: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  badge?: string;
};

const Row = ({ icon: Icon, title, desc, checked, onChange, disabled, badge }: RowProps) => (
  <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
    <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
    <div className="min-w-0 flex-1">
      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
        {title}
        {badge && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {badge}
          </span>
        )}
      </p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
    <Switch
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      aria-label={title}
    />
  </div>
);

const OnboardingModal = () => {
  const { user, updatePreferences } = useAuth();
  const [inApp, setInApp] = useState(true);
  const [email, setEmail] = useState(false);
  const [push, setPush] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const supportsPush = pushSupported();

  const open = !!user && !user.onboarded;

  const handlePush = async (v: boolean) => {
    setPushBusy(true);
    try {
      if (v) {
        await enablePush();
        setPush(true);
      } else {
        await disablePush();
        setPush(false);
      }
    } catch (err) {
      const code = (err as Error).message;
      if (code === "denied") {
        toast.error("Notifications are blocked in your browser settings");
      } else if (code === "unsupported") {
        toast.error("This browser doesn't support push notifications");
      } else if (code === "missing-key") {
        toast.error("Push isn't configured on this server");
      } else {
        toast.error("Couldn't enable push notifications");
      }
    } finally {
      setPushBusy(false);
    }
  };

  const finish = async (prefs: {
    inAppNotifications?: boolean;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
  }) => {
    setBusy(true);
    try {
      await updatePreferences({ ...prefs, onboarded: true });
    } catch {
      toast.error("Couldn't save your preferences");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Welcome to{" "}
            <span className="text-emerald-600 dark:text-emerald-400">
              Warranty
            </span>{" "}
            Tracker
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Choose how you'd like to be reminded before your warranties expire.
          You can change this anytime in Settings.
        </p>
        <div className="mt-2 space-y-2.5">
          <Row
            icon={Bell}
            title="In-app alerts"
            desc="A popup while you have the app open."
            checked={inApp}
            onChange={setInApp}
          />
          <Row
            icon={Mail}
            title="Email reminders"
            desc="A digest sent to your inbox before expiry."
            checked={email}
            onChange={setEmail}
          />
          <Row
            icon={Smartphone}
            title="Browser push"
            desc="Get notified even when the app is closed."
            checked={push}
            onChange={handlePush}
            disabled={pushBusy || !supportsPush}
            badge={supportsPush ? undefined : "Unsupported"}
          />
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" disabled={busy} onClick={() => finish({})}>
            Skip
          </Button>
          <Button
            disabled={busy}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() =>
              finish({
                inAppNotifications: inApp,
                emailNotifications: email,
                pushNotifications: push,
              })
            }
          >
            {busy ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
