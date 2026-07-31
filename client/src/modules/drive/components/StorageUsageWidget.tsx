import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/format-bytes.util";

interface StorageUsageWidgetProps {
  usedBytes: number;
  maxStorageInBytes: number;
}

export function StorageUsageWidget({
  usedBytes,
  maxStorageInBytes,
}: StorageUsageWidgetProps) {
  const percent =
    maxStorageInBytes > 0
      ? Math.min(100, Math.round((usedBytes / maxStorageInBytes) * 100))
      : 0;

  return (
    <div className="px-2 py-1.5">
      <Progress value={percent} />
      <p className="text-muted-foreground mt-1.5 text-xs">
        {formatBytes(usedBytes)} of {formatBytes(maxStorageInBytes)} used
      </p>
    </div>
  );
}
