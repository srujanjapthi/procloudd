import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PreviewFallback } from "./PreviewFallback";

interface IframeMediaPreviewProps {
  src: string;
  title: string;
  errorIcon: ReactNode;
  errorTitle: string;
  onDownload: () => void;
}

export function IframeMediaPreview({
  src,
  title,
  errorIcon,
  errorTitle,
  onDownload,
}: IframeMediaPreviewProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading"
  );

  if (status === "error") {
    return (
      <PreviewFallback
        icon={errorIcon}
        title={errorTitle}
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
      <iframe
        src={src}
        title={title}
        className={cn(
          "size-full rounded-lg bg-white",
          status === "loading" && "invisible"
        )}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
      />
    </>
  );
}
