import { Trash2 } from "lucide-react";

export function TrashEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Trash2 className="text-muted-foreground size-10" />
      <div>
        <p className="font-medium">Trash is empty</p>
        <p className="text-muted-foreground text-sm">
          Items you delete will show up here before they're gone for good.
        </p>
      </div>
    </div>
  );
}
