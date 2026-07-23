import APP_CONFIG from "@/constants/config";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto flex h-14 max-w-6xl items-center justify-center px-4 text-xs lg:px-8">
        © {new Date().getFullYear()} {APP_CONFIG.name}. All rights reserved.
      </div>
    </footer>
  );
}
