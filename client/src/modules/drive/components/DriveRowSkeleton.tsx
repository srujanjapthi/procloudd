import { Skeleton } from "@/components/ui/skeleton";

interface DriveRowSkeletonProps {
  showStar?: boolean;
}

export function DriveRowSkeleton({ showStar = true }: DriveRowSkeletonProps) {
  return (
    <div className="flex items-center gap-6 rounded-lg px-3 py-2 text-sm">
      <Skeleton className="size-5 shrink-0 rounded" />

      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-48 max-w-full" />
        <Skeleton className="mt-1.5 h-3 w-40 max-w-full lg:hidden" />
      </div>

      <div className="hidden w-28 shrink-0 lg:block">
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="hidden w-20 shrink-0 justify-end lg:flex">
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="hidden w-32 shrink-0 justify-end lg:flex">
        <Skeleton className="h-4 w-16" />
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {showStar && <Skeleton className="size-7 rounded-md" />}
        <Skeleton className="size-7 rounded-md" />
      </div>
    </div>
  );
}
