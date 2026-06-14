import { useState, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  ArrowLeft,
  Bell,
  Mail,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  LayoutGrid,
  List,
  Trash2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

type ToggleRowProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  checked?: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  badge?: string;
};

const ToggleRow = ({
  icon: Icon,
  title,
  desc,
  checked,
  onChange,
  disabled,
  badge,
}: ToggleRowProps) => (
  <div className="flex items-center gap-3 py-3">
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

type SegOption<T extends string> = {
  value: T;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: SegOption<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border p-1">
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-border bg-card p-5">
    <h2 className="mb-1 text-sm font-semibold text-foreground">{title}</h2>
    {children}
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const { user, updatePreferences, deleteAccount } = useAuth();
  const { theme, setTheme } = useTheme();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const view =
    (user?.defaultView as "cards" | "list") ??
    ((localStorage.getItem("wtView") as "cards" | "list") || "cards");

  const setPref = (patch: Parameters<typeof updatePreferences>[0]) => {
    updatePreferences(patch).catch(() => toast.error("Couldn't save that"));
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      toast.success("Your account and data were deleted");
    } catch {
      toast.error("Couldn't delete your account");
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <main className="nice-scroll flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </button>

          <h1 className="mb-5 text-2xl font-bold text-foreground">Settings</h1>

          <div className="space-y-4">
            <Section title="Appearance">
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 py-1">
                <span className="text-sm text-muted-foreground">Theme</span>
                <Segmented
                  value={(theme as "dark" | "light" | "system") ?? "dark"}
                  onChange={(v) => setTheme(v)}
                  options={[
                    { value: "dark", label: "Dark", icon: Moon },
                    { value: "light", label: "Light", icon: Sun },
                    { value: "system", label: "System", icon: Monitor },
                  ]}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 py-1">
                <span className="text-sm text-muted-foreground">
                  Default view
                </span>
                <Segmented
                  value={view}
                  onChange={(v) => {
                    localStorage.setItem("wtView", v);
                    setPref({ defaultView: v });
                  }}
                  options={[
                    { value: "cards", label: "Cards", icon: LayoutGrid },
                    { value: "list", label: "List", icon: List },
                  ]}
                />
              </div>
            </Section>

            <Section title="Notifications">
              <ToggleRow
                icon={Bell}
                title="In-app alerts"
                desc="A popup while you have the app open."
                checked={user?.inAppNotifications}
                onChange={(v) => setPref({ inAppNotifications: v })}
              />
              <div className="border-t border-border" />
              <ToggleRow
                icon={Mail}
                title="Email reminders"
                desc="A digest sent to your inbox before warranties expire."
                checked={user?.emailNotifications}
                onChange={(v) => setPref({ emailNotifications: v })}
              />
              <div className="border-t border-border" />
              <ToggleRow
                icon={Smartphone}
                title="Browser push"
                desc="Get notified even when the app is closed."
                disabled
                badge="Coming soon"
              />
            </Section>

            <Section title="Danger zone">
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-sm text-xs text-muted-foreground">
                  Permanently delete your account and everything in it:
                  products, documents, receipts, reminders and chat history.
                  This cannot be undone.
                </p>
                <Button
                  variant="outline"
                  className="gap-2 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                  onClick={() => {
                    setConfirmText("");
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete account
                </Button>
              </div>
            </Section>
          </div>
        </div>
      </main>

      <Dialog
        open={deleteOpen}
        onOpenChange={(o) => !deleting && setDeleteOpen(o)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This permanently removes your account and all of your data
            (products, documents, receipts, reminders and chat history). It
            cannot be undone. Type <span className="font-semibold text-foreground">DELETE</span> to confirm.
          </p>
          <Input
            autoFocus
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
          />
          <div className="mt-2 flex justify-end gap-3">
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              disabled={deleting || confirmText !== "DELETE"}
              className="gap-2 text-red-500 hover:bg-red-500/10 hover:text-red-500"
              onClick={handleDelete}
            >
              {deleting ? "Deleting..." : "Delete everything"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
