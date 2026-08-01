import { FileTypeIcon } from "../FileTypeIcon";
import { PreviewFallback } from "./PreviewFallback";
import type { PreviewComponentProps } from "./previewRegistry";

export function UnsupportedPreview({
  extension,
  onDownload,
}: PreviewComponentProps) {
  const label = extension ? `${extension.toUpperCase()} files` : "This file";

  return (
    <PreviewFallback
      icon={<FileTypeIcon extension={extension} className="size-16" />}
      title="Preview isn't available"
      description={`${label} can't be previewed in the browser. Download it to view the contents.`}
      onDownload={onDownload}
    />
  );
}
