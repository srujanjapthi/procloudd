import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StarToggleButtonProps {
  starred: boolean;
  disabled?: boolean;
  onToggle: (starred: boolean) => void;
  className?: string;
}

export function StarToggleButton({
  starred,
  disabled,
  onToggle,
  className,
}: StarToggleButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={starred ? "Remove from Starred" : "Add to Starred"}
      aria-pressed={starred}
      disabled={disabled}
      onClick={() => onToggle(!starred)}
      className={cn("shrink-0", className)}
    >
      <Star
        className={cn(
          starred
            ? "fill-amber-400 text-amber-400"
            : "text-muted-foreground/50 hover:text-muted-foreground"
        )}
      />
    </Button>
  );
}
