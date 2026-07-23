import type { ReactNode } from "react";
import { Monitor } from "lucide-react";

interface SessionRowProps {
  device: string;
  relativeTime: string;
  isCurrent?: boolean;
  action: ReactNode;
}

export function SessionRow({
  device,
  relativeTime,
  isCurrent,
  action,
}: SessionRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border p-3">
      <div className="flex items-center gap-3">
        <Monitor className="text-muted-foreground size-4 shrink-0" />
        <div>
          <p className="text-sm font-medium">
            {device}
            {isCurrent && (
              <span className="text-muted-foreground ml-2 text-xs font-normal">
                This device
              </span>
            )}
          </p>
          <p className="text-muted-foreground text-xs">{relativeTime}</p>
        </div>
      </div>

      {action}
    </div>
  );
}
