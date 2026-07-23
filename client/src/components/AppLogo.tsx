import { Link } from "react-router";
import LogoMark from "@/assets/logo-mark.svg?react";
import { cn } from "@/lib/utils";
import APP_CONFIG from "@/constants/config";

interface AppLogoProps {
  className?: string;
  showText?: boolean;
  to?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: { mark: "w-8! h-6!", text: "text-lg", gap: "gap-2" },
  md: { mark: "w-10! h-7!", text: "text-2xl", gap: "gap-2.5" },
  lg: { mark: "w-11! h-8!", text: "text-3xl", gap: "gap-3" },
} as const;

export function AppLogo({
  className,
  showText = true,
  to,
  size = "md",
}: AppLogoProps) {
  const sizes = sizeClasses[size];

  const content = (
    <>
      <LogoMark
        className={cn("text-foreground", sizes.mark)}
        aria-hidden="true"
      />
      {showText && (
        <span
          className={cn(
            "text-foreground font-semibold tracking-tight select-none",
            "group-data-[collapsible=icon]:hidden",
            sizes.text
          )}
        >
          {APP_CONFIG.name}
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cn("flex items-center", sizes.gap, className)}>
        {content}
      </Link>
    );
  }

  return (
    <div className={cn("flex items-center", sizes.gap, className)}>
      {content}
    </div>
  );
}
