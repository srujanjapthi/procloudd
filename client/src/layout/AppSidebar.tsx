import { Link, useLocation } from "react-router";
import { LayoutDashboard } from "lucide-react";
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
import { useAuth } from "@/modules/auth/context/AuthContext";
import ROUTES from "@/constants/routes";

const NAV_ITEMS = [
  { title: "Dashboard", url: ROUTES.dashboard, icon: LayoutDashboard },
];

interface AppSidebarProps {
  onOpenSettings: () => void;
}

export function AppSidebar({ onOpenSettings }: AppSidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link to={ROUTES.dashboard} />}
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
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    render={<Link to={item.url} />}
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator className="mx-0" />
        <SidebarMenu>
          <SidebarMenuItem>
            {user && <UserMenu user={user} onOpenSettings={onOpenSettings} />}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
