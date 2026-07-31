import { HardDrive, File, Folder, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

function StatTile({ icon: Icon, label, value }: StatTileProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-4">
      <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Icon className="text-muted-foreground size-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold">{value}</p>
        <p className="text-muted-foreground text-xs">{label}</p>
      </div>
    </div>
  );
}

interface QuickStatsRowProps {
  usedPercent: number;
  fileCount: number;
  directoryCount: number;
  trashedItemCount: number;
}

export function QuickStatsRow({
  usedPercent,
  fileCount,
  directoryCount,
  trashedItemCount,
}: QuickStatsRowProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatTile
        icon={HardDrive}
        label="Storage used"
        value={`${usedPercent}%`}
      />
      <StatTile icon={File} label="Files" value={fileCount.toLocaleString()} />
      <StatTile
        icon={Folder}
        label="Folders"
        value={directoryCount.toLocaleString()}
      />
      <StatTile
        icon={Trash2}
        label="In trash"
        value={trashedItemCount.toLocaleString()}
      />
    </div>
  );
}
