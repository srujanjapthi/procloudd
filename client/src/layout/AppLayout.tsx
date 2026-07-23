import { Outlet } from "react-router";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ModeToggle";
import { SettingsDialog } from "@/modules/settings/components/SettingsDialog";
import { useSettingsDialogState } from "@/modules/settings/hooks/useSettingsDialogState";
import { useAuth } from "@/modules/auth/context/AuthContext";
import { AppSidebar } from "./AppSidebar";

export default function AppLayout() {
  const { user } = useAuth();
  const {
    isOpen,
    activeSection,
    onOpenChange,
    onActiveSectionChange,
    openSettings,
  } = useSettingsDialogState();

  return (
    <SidebarProvider>
      <AppSidebar onOpenSettings={openSettings} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <ModeToggle />
        </header>
        <main className="flex flex-1 flex-col p-6">
          <Outlet />
        </main>
      </SidebarInset>

      {user && (
        <SettingsDialog
          open={isOpen}
          onOpenChange={onOpenChange}
          activeSection={activeSection}
          onActiveSectionChange={onActiveSectionChange}
          user={user}
        />
      )}
    </SidebarProvider>
  );
}
