import { Palette, Shield, User as UserIcon } from "lucide-react";

export const SETTINGS_SECTIONS = [
  { id: "account", label: "Account", icon: UserIcon },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]["id"];
