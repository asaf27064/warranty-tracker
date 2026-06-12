import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  // Performs the action. Throw to keep the dialog open (e.g. on failure).
  onConfirm: () => void | Promise<void>;
};

// Shared confirmation modal for destructive actions. Manages its own busy
// state and closes itself once onConfirm resolves.
const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
}: Props) => {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Leave the dialog open; the caller surfaces the error.
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
        <div className="mt-2 flex justify-end gap-3">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            className="gap-2 text-red-500 hover:bg-red-500/10 hover:text-red-500"
            onClick={handleConfirm}
          >
            {busy ? "Working..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
