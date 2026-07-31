import { FileTypeIcon } from "@/modules/drive/components/FileTypeIcon";
import { formatBytes } from "@/lib/format-bytes.util";
import type { FileProfile } from "@/modules/drive/types";

interface LargestFilesCardProps {
  files: FileProfile[];
}

export function LargestFilesCard({ files }: LargestFilesCardProps) {
  return (
    <div className="rounded-xl border p-5">
      <h2 className="text-sm font-medium">Largest files</h2>

      {files.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">No files yet.</p>
      ) : (
        <ul className="mt-3 divide-y">
          {files.map((file) => (
            <li key={file.id} className="flex items-center gap-3 py-2.5">
              <FileTypeIcon extension={file.extension} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {file.name}
              </span>
              <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                {formatBytes(file.sizeInBytes)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
