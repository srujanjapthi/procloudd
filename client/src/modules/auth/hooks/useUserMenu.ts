import { useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";

export function useUserMenu(onOpenSettings: () => void) {
  const { isMobile, setOpenMobile } = useSidebar();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  function openSettings() {
    setOpenMobile(false);
    onOpenSettings();
  }

  function openLogoutDialog() {
    setOpenMobile(false);
    setLogoutDialogOpen(true);
  }

  return {
    isMobile,
    openSettings,
    logoutDialogOpen,
    setLogoutDialogOpen,
    openLogoutDialog,
  };
}
