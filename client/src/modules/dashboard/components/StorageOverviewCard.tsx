import { formatBytes } from "@/lib/format-bytes.util";
import { cn } from "@/lib/utils";
import { STORAGE_CATEGORY_COLORS } from "../utils/storage-category.util";
import type { CategoryBreakdown } from "../hooks/useDashboardPage";

interface StorageOverviewCardProps {
  usedBytes: number;
  maxStorageInBytes: number;
  categoryBreakdown: CategoryBreakdown[];
}

export function StorageOverviewCard({
  usedBytes,
  maxStorageInBytes,
  categoryBreakdown,
}: StorageOverviewCardProps) {
  return (
    <div className="rounded-xl border p-5">
      <h2 className="text-sm font-medium">Storage</h2>
      <p className="mt-1 text-2xl font-semibold">
        {formatBytes(usedBytes)}{" "}
        <span className="text-muted-foreground text-base font-normal">
          of {formatBytes(maxStorageInBytes)} used
        </span>
      </p>

      <div className="bg-muted mt-4 flex h-3 overflow-hidden rounded-full">
        {categoryBreakdown.map(({ category, sizeInBytes }) => (
          <div
            key={category}
            className={STORAGE_CATEGORY_COLORS[category]}
            style={{
              width: `${
                maxStorageInBytes > 0
                  ? (sizeInBytes / maxStorageInBytes) * 100
                  : 0
              }%`,
            }}
          />
        ))}
      </div>

      {categoryBreakdown.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {categoryBreakdown.map(({ category, sizeInBytes }) => (
            <li key={category} className="flex items-center gap-2 text-sm">
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  STORAGE_CATEGORY_COLORS[category]
                )}
              />
              <span className="min-w-0 flex-1 truncate">{category}</span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {formatBytes(sizeInBytes)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground mt-4 text-sm">
          No files yet — upload something in My Drive to see a breakdown here.
        </p>
      )}
    </div>
  );
}
