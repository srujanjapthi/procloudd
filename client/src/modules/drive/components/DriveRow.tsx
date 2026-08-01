import { Link } from "react-router";
import { Folder } from "lucide-react";
import { formatBytes } from "@/lib/format-bytes.util";
import { formatRelativeTime } from "@/lib/date.util";
import { DriveItemActionsMenu } from "./DriveItemActionsMenu";
import { FileTypeIcon } from "./FileTypeIcon";
import type { DriveItemRef } from "../hooks/useDriveItemActions";

interface DriveRowProps {
  item: DriveItemRef;
  baseName?: string;
  extension?: string;
  sizeInBytes: number;
  createdAt: string;
  updatedAt: string;
  dirId: string;
  folderName: string;
  onPreviewFile: (fileId: string) => void;
}

export function DriveRow({
  item,
  baseName,
  extension,
  sizeInBytes,
  createdAt,
  updatedAt,
  dirId,
  folderName,
  onPreviewFile,
}: DriveRowProps) {
  const isDirectory = item.type === "directory";

  return (
    <div className="hover:bg-muted/50 flex items-center gap-6 rounded-lg px-3 py-2 text-sm">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {isDirectory ? (
          <Folder className="text-muted-foreground size-5 shrink-0" />
        ) : (
          <FileTypeIcon extension={extension ?? ""} />
        )}

        <div className="min-w-0 flex-1">
          {isDirectory ? (
            <Link
              to={`/drive/${item.id}`}
              className="block truncate font-medium hover:underline"
            >
              {item.name}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onPreviewFile(item.id)}
              className="block max-w-full truncate text-left font-medium hover:underline"
            >
              {item.name}
            </button>
          )}
          <p className="text-muted-foreground mt-0.5 truncate text-xs lg:hidden">
            {isDirectory ? "Folder" : `${(extension ?? "").toUpperCase()} file`}{" "}
            · {formatBytes(sizeInBytes)} ·{" "}
            {formatRelativeTime(new Date(updatedAt).getTime())}
          </p>
        </div>
      </div>

      <span className="text-muted-foreground hidden w-28 shrink-0 truncate lg:block">
        {isDirectory ? "Folder" : `${(extension ?? "").toUpperCase()} file`}
      </span>

      <span className="text-muted-foreground hidden w-20 shrink-0 text-right tabular-nums lg:block">
        {formatBytes(sizeInBytes)}
      </span>
      <span className="text-muted-foreground hidden w-32 shrink-0 text-right whitespace-nowrap lg:block">
        {formatRelativeTime(new Date(updatedAt).getTime())}
      </span>

      <DriveItemActionsMenu
        item={item}
        baseName={baseName}
        extension={extension}
        sizeInBytes={sizeInBytes}
        createdAt={createdAt}
        updatedAt={updatedAt}
        dirId={dirId}
        locationName={folderName}
        onPreviewFile={onPreviewFile}
      />
    </div>
  );
}
