import notFoundIllustration from "@/assets/illustrations/404-error-with-a-cute-animal-animate.svg";
import { cn } from "@/lib/utils";

interface NotFoundIllustrationProps {
  className?: string;
}

export function NotFoundIllustration({ className }: NotFoundIllustrationProps) {
  return (
    <img
      src={notFoundIllustration}
      alt=""
      className={cn("h-48 w-auto max-w-xs sm:h-64", className)}
      draggable={false}
    />
  );
}
