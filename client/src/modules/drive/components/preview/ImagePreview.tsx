import { useState } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PreviewFallback } from "./PreviewFallback";
import type { PreviewComponentProps } from "./previewRegistry";

export function ImagePreview({
  previewUrl,
  fileName,
  onDownload,
}: PreviewComponentProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading"
  );

  if (status === "error") {
    return (
      <PreviewFallback
        icon={<ImageOff className="size-12 text-white/40" />}
        title="Couldn't load this image"
        description="Something went wrong loading the preview. Try downloading it instead."
        onDownload={onDownload}
      />
    );
  }

  return (
    <>
      {status === "loading" && (
        <Loader2 className="absolute size-8 animate-spin text-white/60" />
      )}
      <img
        src={previewUrl}
        alt={fileName}
        className={cn(
          "max-h-full max-w-full object-contain",
          status === "loading" && "invisible"
        )}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
      />
    </>
  );
}
