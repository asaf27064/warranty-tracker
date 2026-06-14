import { useState, type ComponentType } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Bell, Mail, Smartphone } from "lucide-react";
import { useAuth } from "../context/AuthContext";
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
  const [busy, setBusy] = useState(false);

  const open = !!user && !user.onboarded;

  const finish = async (prefs: {
    inAppNotifications?: boolean;
    emailNotifications?: boolean;
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
          <DialogTitle>Welcome to Warranty Tracker</DialogTitle>
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
            disabled
            badge="Coming soon"
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
              finish({ inAppNotifications: inApp, emailNotifications: email })
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
