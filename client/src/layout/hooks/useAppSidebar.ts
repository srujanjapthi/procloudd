import { useLocation } from "react-router";
import { useSidebar } from "@/components/ui/sidebar";

export function useAppSidebar() {
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();

  function isActive(url: string): boolean {
    return location.pathname.startsWith(url);
  }

  function closeMobileSidebar() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return { isActive, closeMobileSidebar };
}
