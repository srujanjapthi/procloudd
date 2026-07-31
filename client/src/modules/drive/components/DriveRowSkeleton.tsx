import { Skeleton } from "@/components/ui/skeleton";

export function DriveRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm">
      <Skeleton className="size-5 shrink-0 rounded" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-48 max-w-full" />
        <Skeleton className="mt-1.5 h-3 w-24 md:hidden" />
      </div>
      <div className="hidden w-20 shrink-0 justify-end md:flex">
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="hidden w-32 shrink-0 justify-end md:flex">
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="size-7 shrink-0 rounded-md" />
    </div>
  );
}
