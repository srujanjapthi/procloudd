import { FileX } from "lucide-react";
import { IframeMediaPreview } from "./IframeMediaPreview";
import type { PreviewComponentProps } from "./previewRegistry";

export function PdfPreview({
  previewUrl,
  fileName,
  onDownload,
}: PreviewComponentProps) {
  return (
    <IframeMediaPreview
      src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
      title={fileName}
      errorIcon={<FileX className="size-12 text-white/40" />}
      errorTitle="Couldn't load this PDF"
      onDownload={onDownload}
    />
  );
}
