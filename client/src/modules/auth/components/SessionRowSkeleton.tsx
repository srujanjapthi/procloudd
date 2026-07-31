import { Skeleton } from "@/components/ui/skeleton";

export function SessionRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-4 shrink-0 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}
