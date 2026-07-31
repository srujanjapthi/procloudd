import { Folder } from "lucide-react";
import { formatBytes } from "@/lib/format-bytes.util";
import { formatRelativeTime } from "@/lib/date.util";
import { FileTypeIcon } from "@/modules/drive/components/FileTypeIcon";
import type { DriveItemRef } from "@/modules/drive/hooks/useDriveItemActions";
import { TrashItemActionsMenu } from "./TrashItemActionsMenu";

interface TrashRowProps {
  item: DriveItemRef;
  extension?: string;
  sizeInBytes: number;
  trashedAt: string;
}

export function TrashRow({
  item,
  extension,
  sizeInBytes,
  trashedAt,
}: TrashRowProps) {
  const isDirectory = item.type === "directory";
  const typeLabel = isDirectory
    ? "Folder"
    : `${(extension ?? "").toUpperCase()} file`;

  return (
    <div className="hover:bg-muted/50 flex items-center gap-6 rounded-lg px-3 py-2 text-sm">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {isDirectory ? (
          <Folder className="text-muted-foreground size-5 shrink-0" />
        ) : (
          <FileTypeIcon extension={extension ?? ""} />
        )}

        <div className="min-w-0 flex-1">
          <span className="block truncate font-medium">{item.name}</span>
          <p className="text-muted-foreground mt-0.5 truncate text-xs lg:hidden">
            {typeLabel} · {formatBytes(sizeInBytes)} · Trashed{" "}
            {formatRelativeTime(new Date(trashedAt).getTime())}
          </p>
        </div>
      </div>

      <span className="text-muted-foreground hidden w-28 shrink-0 truncate lg:block">
        {typeLabel}
      </span>

      <span className="text-muted-foreground hidden w-20 shrink-0 text-right tabular-nums lg:block">
        {formatBytes(sizeInBytes)}
      </span>
      <span className="text-muted-foreground hidden w-32 shrink-0 text-right whitespace-nowrap lg:block">
        {formatRelativeTime(new Date(trashedAt).getTime())}
      </span>

      <TrashItemActionsMenu item={item} />
    </div>
  );
}
