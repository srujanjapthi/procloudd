import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/modules/auth/types";
import { SETTINGS_SECTIONS, type SettingsSectionId } from "../constants";
import { AccountSection } from "./AccountSection";
import { SecuritySection } from "./SecuritySection";
import { AppearanceSection } from "./AppearanceSection";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeSection: SettingsSectionId;
  onActiveSectionChange: (section: SettingsSectionId) => void;
  user: CurrentUser;
}

export function SettingsDialog({
  open,
  onOpenChange,
  activeSection,
  onActiveSectionChange,
  user,
}: SettingsDialogProps) {
  const [nestedDialogOpen, setNestedDialogOpen] = useState(false);

  const sectionContent: Record<SettingsSectionId, React.ReactNode> = {
    account: <AccountSection user={user} />,
    security: (
      <SecuritySection
        user={user}
        onNestedDialogOpenChange={setNestedDialogOpen}
      />
    ),
    appearance: <AppearanceSection />,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[95vh] max-h-[95vh] w-[95vw] max-w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <div
          aria-hidden="true"
          className={cn(
            "bg-background/70 absolute inset-0 z-10 backdrop-blur-sm transition-opacity duration-150",
            nestedDialogOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          )}
        />

        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <nav className="flex shrink-0 gap-0.5 overflow-x-auto border-b p-3 sm:w-52 sm:flex-col sm:overflow-x-visible sm:overflow-y-auto sm:border-r sm:border-b-0">
            {SETTINGS_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => onActiveSectionChange(section.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
                  activeSection === section.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <section.icon className="size-4" />
                {section.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto p-6">
            {sectionContent[activeSection]}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
