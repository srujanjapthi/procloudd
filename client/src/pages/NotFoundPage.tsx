import { Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/AppLogo";
import { NotFoundIllustration } from "@/components/NotFoundIllustration";
import { useAuth } from "@/modules/auth/context/AuthContext";
import ROUTES from "@/constants/routes";

export default function NotFoundPage() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 px-4 text-center">
      <AppLogo size="md" />

      <div className="flex flex-col items-center gap-5">
        <NotFoundIllustration />

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Nothing here
          </h1>
          <p className="text-muted-foreground max-w-sm text-sm text-balance">
            We couldn&apos;t find{" "}
            <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
              {location.pathname}
            </code>{" "}
            — it may have been moved, renamed, or never existed.
          </p>
        </div>
      </div>

      <Button render={<Link to={user ? ROUTES.dashboard : ROUTES.home} />}>
        {user ? "Back to dashboard" : "Back to home"}
      </Button>
    </div>
  );
}
