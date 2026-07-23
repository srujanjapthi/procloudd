import { Navigate, Link } from "react-router";
import { ShieldCheck, FolderTree, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/AppLogo";
import { ModeToggle } from "@/components/ModeToggle";
import { Footer } from "@/layout/Footer";
import { useAuth } from "@/modules/auth/context/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import ROUTES from "@/constants/routes";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Secure by default",
    description:
      "Every file is tied to your account and access-controlled — nothing is public unless you decide to share it.",
  },
  {
    icon: FolderTree,
    title: "Organized your way",
    description:
      "Structure your files into folders exactly how you think about them, not how the app thinks you should.",
  },
  {
    icon: Globe,
    title: "Access anywhere",
    description:
      "Upload once from any device, and reach your files from anywhere you can sign in.",
  },
];

export default function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
          <AppLogo to={ROUTES.home} />
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button variant="ghost" render={<Link to={ROUTES.auth.login} />}>
              Sign in
            </Button>
            <Button render={<Link to={ROUTES.auth.register} />}>
              Get started
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 text-center lg:px-8 lg:py-28">
          <h1 className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight text-balance lg:text-5xl">
            Your files, organized and secure.
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg text-balance">
            Simple, private cloud storage built for you — upload, organize, and
            get to your files from anywhere.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" render={<Link to={ROUTES.auth.register} />}>
              Get started for free
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link to={ROUTES.auth.login} />}
            >
              Sign in
            </Button>
          </div>
        </section>

        <section className="border-t">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:grid-cols-3 lg:px-8">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="space-y-2">
                <feature.icon className="text-foreground size-6" />
                <h2 className="font-medium">{feature.title}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
