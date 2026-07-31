import {
  Folder,
  FolderOpen,
  Tag,
  HardDrive,
  Calendar,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBytes } from "@/lib/format-bytes.util";
import { formatAbsoluteDate } from "@/lib/date.util";
import { FileTypeIcon } from "./FileTypeIcon";
import type { DriveItemRef } from "../hooks/useDriveItemActions";
import type { LucideIcon } from "lucide-react";

interface DetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: DriveItemRef;
  extension?: string;
  sizeInBytes: number;
  createdAt: string;
  updatedAt: string;
  locationName: string;
}

function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2.5 text-sm">
      <span className="text-muted-foreground flex shrink-0 items-center gap-2">
        <Icon className="size-4" />
        {label}
      </span>
      <span className="min-w-0 truncate text-right font-medium">{value}</span>
    </div>
  );
}

export function DetailsDialog({
  open,
  onOpenChange,
  item,
  extension,
  sizeInBytes,
  createdAt,
  updatedAt,
  locationName,
}: DetailsDialogProps) {
  const isDirectory = item.type === "directory";
  const typeLabel = isDirectory
    ? "Folder"
    : `${(extension ?? "").toUpperCase()} file`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="items-center text-center">
          <div className="bg-muted flex size-16 items-center justify-center rounded-2xl">
            {isDirectory ? (
              <Folder className="text-muted-foreground size-8" />
            ) : (
              <FileTypeIcon extension={extension ?? ""} className="size-8" />
            )}
          </div>
          <DialogTitle className="w-full min-w-0 truncate">
            {item.name}
          </DialogTitle>
          <p className="text-muted-foreground -mt-1 w-full min-w-0 truncate text-sm">
            {typeLabel} · {formatBytes(sizeInBytes)}
          </p>
        </DialogHeader>

        <div className="divide-y rounded-lg border">
          <StatRow icon={Tag} label="Type" value={typeLabel} />
          <StatRow icon={FolderOpen} label="Location" value={locationName} />
          <StatRow
            icon={HardDrive}
            label="Size"
            value={formatBytes(sizeInBytes)}
          />
          <StatRow
            icon={Calendar}
            label="Created"
            value={formatAbsoluteDate(new Date(createdAt).getTime())}
          />
          <StatRow
            icon={Clock}
            label="Modified"
            value={formatAbsoluteDate(new Date(updatedAt).getTime())}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
