import { Star } from "lucide-react";

export function StarredEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Star className="text-muted-foreground size-10" />
      <div>
        <p className="font-medium">Nothing starred yet</p>
        <p className="text-muted-foreground text-sm">
          Star a file or folder to keep it close at hand.
        </p>
      </div>
    </div>
  );
}
