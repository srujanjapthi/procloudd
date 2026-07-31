import { CheckCircle2, X, RotateCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { UploadItem } from "../hooks/useFileUpload";

interface UploadTrayProps {
  uploads: UploadItem[];
  onRetry: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function UploadTray({ uploads, onRetry, onDismiss }: UploadTrayProps) {
  if (uploads.length === 0) {
    return null;
  }

  return (
    <div className="bg-popover ring-foreground/10 fixed right-4 bottom-4 left-4 z-40 rounded-xl p-3 shadow-lg ring-1 sm:left-auto sm:w-80">
      <p className="text-muted-foreground mb-2 text-xs font-medium">
        Uploading {uploads.length} {uploads.length === 1 ? "item" : "items"}
      </p>
      <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
        {uploads.map((upload) => (
          <div key={upload.id} className="flex items-center gap-2 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate">{upload.name}</p>
              {upload.status === "uploading" && (
                <Progress value={upload.progress} className="mt-1" />
              )}
              {upload.status === "error" && (
                <p className="text-destructive text-xs">{upload.error}</p>
              )}
            </div>
            {upload.status === "uploading" && (
              <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
            )}
            {upload.status === "done" && (
              <CheckCircle2 className="size-4 shrink-0 text-green-600" />
            )}
            {upload.status === "error" && (
              <>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Retry upload"
                  onClick={() => onRetry(upload.id)}
                >
                  <RotateCw />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Dismiss"
                  onClick={() => onDismiss(upload.id)}
                >
                  <X />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
