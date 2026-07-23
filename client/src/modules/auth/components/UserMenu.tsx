import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { ConfirmDialogContent } from "@/components/ConfirmDialogContent";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useAccountActions } from "../hooks/useAccountActions";
import { useUserMenu } from "../hooks/useUserMenu";
import type { CurrentUser } from "../types";

interface UserMenuProps {
  user: CurrentUser;
  onOpenSettings: () => void;
}

export function UserMenu({ user, onOpenSettings }: UserMenuProps) {
  const {
    isMobile,
    openSettings,
    logoutDialogOpen,
    setLogoutDialogOpen,
    openLogoutDialog,
  } = useUserMenu(onOpenSettings);
  const { initials, fullName, avatarUrl, handleLogout, isLoggingOut } =
    useAccountActions(user);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              size="lg"
              className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
            />
          }
        >
          <Avatar>
            <AvatarImage src={avatarUrl} alt={fullName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{fullName}</span>
            <span className="text-muted-foreground truncate text-xs">
              @{user.username}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-(--anchor-width) min-w-56"
          side={isMobile ? "bottom" : "right"}
          align="end"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-2 px-1 py-0.5">
                <Avatar>
                  <AvatarImage src={avatarUrl} alt={fullName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{fullName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    @{user.username}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={openSettings}>
            <Settings />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openLogoutDialog}>
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <ConfirmDialogContent
          title="Log out?"
          description="You'll need to sign in again on this device."
          confirmLabel="Log out"
          onConfirm={() => handleLogout(false)}
          isConfirming={isLoggingOut}
        />
      </AlertDialog>
    </>
  );
}
