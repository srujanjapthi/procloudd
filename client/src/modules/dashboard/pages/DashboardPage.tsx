import { Link } from "react-router";
import { HardDrive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ROUTES from "@/constants/routes";
import { useDashboardPage } from "../hooks/useDashboardPage";
import { QuickStatsRow } from "../components/QuickStatsRow";
import { StorageOverviewCard } from "../components/StorageOverviewCard";
import { LargestFilesCard } from "../components/LargestFilesCard";
import { DashboardSkeleton } from "../components/DashboardSkeleton";

export default function DashboardPage() {
  const {
    firstName,
    usedBytes,
    maxStorageInBytes,
    usedPercent,
    fileCount,
    directoryCount,
    trashedItemCount,
    categoryBreakdown,
    largestFiles,
    isLoading,
    isError,
  } = useDashboardPage();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {firstName ? `Welcome back, ${firstName}` : "Dashboard"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Here&apos;s an overview of your storage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link to={ROUTES.trash} />}>
            <Trash2 />
            Trash
          </Button>
          <Button render={<Link to={ROUTES.drive} />}>
            <HardDrive />
            Go to My Drive
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="mt-6">
          <DashboardSkeleton />
        </div>
      )}

      {isError && (
        <p className="text-destructive mt-6 text-sm">
          Couldn&apos;t load your storage overview. Try reloading the page.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="mt-6 space-y-4">
          <QuickStatsRow
            usedPercent={usedPercent}
            fileCount={fileCount}
            directoryCount={directoryCount}
            trashedItemCount={trashedItemCount}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <StorageOverviewCard
              usedBytes={usedBytes}
              maxStorageInBytes={maxStorageInBytes}
              categoryBreakdown={categoryBreakdown}
            />
            <LargestFilesCard files={largestFiles} />
          </div>
        </div>
      )}
    </div>
  );
}
