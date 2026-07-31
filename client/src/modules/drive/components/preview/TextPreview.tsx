import { useEffect, useState } from "react";
import { FileX, Loader2 } from "lucide-react";
import APP_CONFIG from "@/constants/config";
import { PreviewFallback } from "./PreviewFallback";
import type { PreviewComponentProps } from "./previewRegistry";

export function TextPreview({
  previewUrl,
  sizeInBytes,
  onDownload,
}: PreviewComponentProps) {
  const [content, setContent] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const isTooLarge = sizeInBytes > APP_CONFIG.preview.maxTextPreviewBytes;

  useEffect(() => {
    if (isTooLarge) {
      return;
    }

    let cancelled = false;

    fetch(previewUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unexpected status ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        if (!cancelled) {
          setContent(text);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [previewUrl, isTooLarge]);

  if (isTooLarge) {
    return (
      <PreviewFallback
        icon={<FileX className="size-12 text-white/40" />}
        title="File too large to preview"
        description="This file is too large to preview in the browser. Download it to view the contents."
        onDownload={onDownload}
      />
    );
  }

  if (hasError) {
    return (
      <PreviewFallback
        icon={<FileX className="size-12 text-white/40" />}
        title="Couldn't load this file"
        description="Something went wrong loading the preview. Try downloading it instead."
        onDownload={onDownload}
      />
    );
  }

  if (content === null) {
    return <Loader2 className="size-8 animate-spin text-white/60" />;
  }

  return (
    <pre className="size-full overflow-auto rounded-lg bg-black/30 p-4 text-left text-sm whitespace-pre-wrap text-white/90">
      {content}
    </pre>
  );
}
