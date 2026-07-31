import { Loader2 } from "lucide-react";

interface ProcessingOverlayProps {
  show: boolean;
  message?: string;
}

export function ProcessingOverlay({
  show,
  message = "Signing you in…",
}: ProcessingOverlayProps) {
  if (!show) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-background/80 fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 backdrop-blur-sm"
    >
      <Loader2 className="text-muted-foreground size-8 animate-spin" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
