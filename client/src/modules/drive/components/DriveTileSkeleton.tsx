import { Skeleton } from "@/components/ui/skeleton";

export function DriveTileSkeleton() {
  return (
    <div className="flex flex-col rounded-lg p-2">
      <div className="flex justify-end">
        <Skeleton className="size-7 rounded-md" />
      </div>
      <div className="flex flex-col items-center gap-2 px-2 pb-2">
        <div className="flex h-16 items-center justify-center">
          <Skeleton className="size-12 rounded" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="mx-auto h-3 w-12" />
    </div>
  );
}
