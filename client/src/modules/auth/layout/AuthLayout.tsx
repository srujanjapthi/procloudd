import type { ReactNode } from "react";
import { AppLogo } from "@/components/AppLogo";

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  illustration: string;
}

export function AuthLayout({
  title,
  description,
  children,
  footer,
  illustration,
}: AuthLayoutProps) {
  return (
    <div className="grid h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="bg-muted/50 relative hidden flex-col items-center justify-center gap-12 overflow-y-auto p-8 lg:flex">
        <AppLogo className="absolute top-8 left-8" />

        <div className="flex flex-col items-center gap-8">
          <img
            src={illustration}
            alt=""
            className="h-auto w-full max-w-3xl"
            draggable={false}
          />

          <div className="space-y-2 text-center">
            <p className="text-foreground text-2xl leading-snug font-medium">
              Your files, organized and secure.
            </p>
            <p className="text-muted-foreground text-sm">
              Simple, private cloud storage built for you.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-background relative flex h-full flex-col overflow-y-auto px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-6 lg:hidden">
          <AppLogo size="sm" />
        </div>

        <div className="flex flex-1 items-center justify-center py-4">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {description && (
                <p className="text-muted-foreground text-sm">{description}</p>
              )}
            </div>
            {children}
            {footer && (
              <div className="text-muted-foreground mt-4 text-center text-sm">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
