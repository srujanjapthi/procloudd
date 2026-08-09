import { Clock } from "lucide-react";

export function RecentEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Clock className="text-muted-foreground size-10" />
      <div>
        <p className="font-medium">No recent files</p>
        <p className="text-muted-foreground text-sm">
          Files you upload or edit will show up here.
        </p>
      </div>
    </div>
  );
}
