import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import APP_CONFIG from "@/constants/config";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium">Appearance</h3>
        <p className="text-muted-foreground text-sm">
          Choose how {APP_CONFIG.name} looks on this device.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors",
              theme === option.value
                ? "border-foreground bg-accent"
                : "border-border hover:bg-accent/50"
            )}
          >
            <option.icon className="size-5" />
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
