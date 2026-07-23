import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAccountActions } from "@/modules/auth/hooks/useAccountActions";
import type { CurrentUser } from "@/modules/auth/types";
import { UpdateProfileForm } from "./UpdateProfileForm";

interface AccountSectionProps {
  user: CurrentUser;
}

export function AccountSection({ user }: AccountSectionProps) {
  const { fields, initials, fullName, avatarUrl } = useAccountActions(user);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarImage src={avatarUrl} alt={fullName} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div className="space-y-0.5">
          <p className="text-base font-semibold">{fullName}</p>
          <p className="text-muted-foreground text-sm">@{user.username}</p>
        </div>
      </div>

      <UpdateProfileForm user={user} fields={fields} />
    </div>
  );
}
