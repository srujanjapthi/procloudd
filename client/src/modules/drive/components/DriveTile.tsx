import { Link } from "react-router";
import { Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/format-bytes.util";
import { DriveItemActionsMenu } from "./DriveItemActionsMenu";
import { FileTypeIcon } from "./FileTypeIcon";
import type { DriveItemRef } from "../hooks/useDriveItemActions";

interface DriveTileProps {
  item: DriveItemRef;
  baseName?: string;
  extension?: string;
  sizeInBytes: number;
  createdAt: string;
  updatedAt: string;
  dirId: string;
  folderName: string;
}

export function DriveTile({
  item,
  baseName,
  extension,
  sizeInBytes,
  createdAt,
  updatedAt,
  dirId,
  folderName,
}: DriveTileProps) {
  const isDirectory = item.type === "directory";
  const icon = isDirectory ? (
    <Folder className="text-muted-foreground size-12" />
  ) : (
    <FileTypeIcon extension={extension ?? ""} className="size-12" />
  );
  const name = (
    <p
      className={cn(
        "wrap-break-words line-clamp-2 w-full text-center text-sm font-medium",
        isDirectory && "hover:underline"
      )}
    >
      {item.name}
    </p>
  );

  return (
    <div className="hover:bg-muted/50 flex flex-col rounded-lg p-2">
      <div className="flex justify-end">
        <DriveItemActionsMenu
          item={item}
          baseName={baseName}
          extension={extension}
          sizeInBytes={sizeInBytes}
          createdAt={createdAt}
          updatedAt={updatedAt}
          dirId={dirId}
          locationName={folderName}
        />
      </div>

      {isDirectory ? (
        <Link
          to={`/drive/${item.id}`}
          className="flex flex-col items-center gap-2 px-2 pb-2"
        >
          <div className="flex h-16 items-center justify-center">{icon}</div>
          {name}
        </Link>
      ) : (
        <div className="flex flex-col items-center gap-2 px-2 pb-2">
          <div className="flex h-16 items-center justify-center">{icon}</div>
          {name}
        </div>
      )}
      <p className="text-muted-foreground text-center text-xs">
        {formatBytes(sizeInBytes)}
      </p>
    </div>
  );
}
