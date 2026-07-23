import LogoMark from "@/assets/logo-mark.svg?react";
import APP_CONFIG from "@/constants/config";

export function LoadingScreen() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3">
      <LogoMark className="text-foreground h-8 w-11" aria-hidden="true" />
      <span className="text-shimmer text-3xl font-semibold tracking-tight select-none">
        {APP_CONFIG.name}
      </span>
    </div>
  );
}
