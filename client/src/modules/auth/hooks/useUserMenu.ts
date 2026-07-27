import { useSidebar } from "@/components/ui/sidebar";

export function useUserMenu() {
  const { isMobile, setOpenMobile } = useSidebar();

  function closeSidebarThen(action: () => void) {
    setOpenMobile(false);
    action();
  }

  return { isMobile, closeSidebarThen };
}
