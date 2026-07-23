import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/AppLogo";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Unhandled render error:", error, errorInfo);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-8 px-4 text-center">
        <AppLogo size="md" />

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-muted-foreground max-w-sm text-sm text-balance">
            An unexpected error occurred. Try reloading the page.
          </p>
        </div>

        <Button onClick={() => window.location.reload()}>
          <RotateCw />
          Reload page
        </Button>
      </div>
    );
  }
}
