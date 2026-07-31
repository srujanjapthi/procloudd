import { useEffect } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileX,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PreviewFallback } from "./PreviewFallback";
import { getPreviewKind, PREVIEW_COMPONENTS } from "./previewRegistry";
import type { FileProfile } from "../../types";

interface FilePreviewOverlayProps {
  file: FileProfile | null;
  previewUrl: string | undefined;
  isLoadingUrl: boolean;
  hasUrlError: boolean;
  hasNext: boolean;
  hasPrev: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onDownload: () => void;
}

const CHROME_BUTTON_CLASSNAME = "text-white hover:bg-white/10 hover:text-white";

export function FilePreviewOverlay({
  file,
  previewUrl,
  isLoadingUrl,
  hasUrlError,
  hasNext,
  hasPrev,
  onClose,
  onNext,
  onPrev,
  onDownload,
}: FilePreviewOverlayProps) {
  useEffect(() => {
    if (!file) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight" && hasNext) {
        onNext();
      } else if (event.key === "ArrowLeft" && hasPrev) {
        onPrev();
      }
    }

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [file, hasNext, hasPrev, onNext, onPrev]);

  const PreviewComponent = file
    ? PREVIEW_COMPONENTS[getPreviewKind(file.extension)]
    : null;

  return (
    <DialogPrimitive.Root
      open={file !== null}
      disablePointerDismissal
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 z-50 bg-black/95" />
        <DialogPrimitive.Popup className="data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 z-50 flex flex-col outline-none">
          <div className="flex items-center justify-between gap-3 bg-linear-to-b from-black/70 to-transparent p-4">
            <p className="min-w-0 truncate text-sm font-medium text-white">
              {file?.name}
            </p>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Open in new tab"
                className={CHROME_BUTTON_CLASSNAME}
                disabled={!previewUrl}
                onClick={() =>
                  previewUrl && window.open(previewUrl, "_blank", "noopener")
                }
              >
                <ExternalLink />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Download"
                className={CHROME_BUTTON_CLASSNAME}
                onClick={onDownload}
              >
                <Download />
              </Button>
              <DialogPrimitive.Close
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Close"
                    className={CHROME_BUTTON_CLASSNAME}
                  />
                }
              >
                <X />
              </DialogPrimitive.Close>
            </div>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-16 sm:pb-4">
            {hasPrev && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Previous file"
                className={cn(
                  CHROME_BUTTON_CLASSNAME,
                  "absolute left-2 sm:left-4"
                )}
                onClick={onPrev}
              >
                <ChevronLeft />
              </Button>
            )}

            {isLoadingUrl && (
              <Loader2 className="size-8 animate-spin text-white/60" />
            )}
            {!isLoadingUrl && hasUrlError && (
              <PreviewFallback
                icon={<FileX className="size-12 text-white/40" />}
                title="Couldn't load this preview"
                description="Something went wrong loading this file. Try downloading it instead."
                onDownload={onDownload}
              />
            )}
            {!isLoadingUrl &&
              !hasUrlError &&
              PreviewComponent &&
              previewUrl &&
              file && (
                <PreviewComponent
                  key={file.id}
                  previewUrl={previewUrl}
                  fileName={file.name}
                  extension={file.extension}
                  sizeInBytes={file.sizeInBytes}
                  onDownload={onDownload}
                />
              )}

            {hasNext && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Next file"
                className={cn(
                  CHROME_BUTTON_CLASSNAME,
                  "absolute right-2 sm:right-4"
                )}
                onClick={onNext}
              >
                <ChevronRight />
              </Button>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
