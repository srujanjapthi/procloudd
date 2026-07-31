import { Link } from "react-router";
import { LayoutDashboard, HardDrive, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { AppLogo } from "@/components/AppLogo";
import { UserMenu } from "@/modules/auth/components/UserMenu";
import { StorageUsageWidget } from "@/modules/drive/components/StorageUsageWidget";
import { useAuth } from "@/modules/auth/context/AuthContext";
import { useAppSidebar } from "./hooks/useAppSidebar";
import ROUTES from "@/constants/routes";

const NAV_ITEMS = [
  { title: "Dashboard", url: ROUTES.dashboard, icon: LayoutDashboard },
  { title: "My Drive", url: ROUTES.drive, icon: HardDrive },
];

const TRASH_NAV_ITEM = { title: "Trash", url: ROUTES.trash, icon: Trash2 };

interface AppSidebarProps {
  onOpenSettings: () => void;
  onRequestLogout: () => void;
}

export function AppSidebar({
  onOpenSettings,
  onRequestLogout,
}: AppSidebarProps) {
  const { user } = useAuth();
  const { isActive, closeMobileSidebar } = useAppSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link to={ROUTES.dashboard} />}
              onClick={closeMobileSidebar}
            >
              <AppLogo size="sm" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    className="h-9"
                    render={<Link to={item.url} />}
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    onClick={closeMobileSidebar}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarSeparator className="mx-0 mb-2" />
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="h-9"
                  render={<Link to={TRASH_NAV_ITEM.url} />}
                  isActive={isActive(TRASH_NAV_ITEM.url)}
                  tooltip={TRASH_NAV_ITEM.title}
                  onClick={closeMobileSidebar}
                >
                  <TRASH_NAV_ITEM.icon
                    className={cn(
                      !isActive(TRASH_NAV_ITEM.url) && "text-destructive/70"
                    )}
                  />
                  <span>{TRASH_NAV_ITEM.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {user && (
          <div className="group-data-[collapsible=icon]:hidden">
            <StorageUsageWidget
              usedBytes={user.storage.usedBytes}
              maxStorageInBytes={user.storage.maxStorageInBytes}
            />
          </div>
        )}
        <SidebarSeparator className="mx-0" />
        <SidebarMenu>
          <SidebarMenuItem>
            {user && (
              <UserMenu
                user={user}
                onOpenSettings={onOpenSettings}
                onRequestLogout={onRequestLogout}
              />
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
