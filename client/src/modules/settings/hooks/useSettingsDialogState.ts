import { useSearchParams } from "react-router";
import { SETTINGS_SECTIONS, type SettingsSectionId } from "../constants";

const SETTINGS_PARAM = "settings";
const VALID_SECTIONS = new Set<string>(
  SETTINGS_SECTIONS.map((section) => section.id)
);

function isValidSection(value: string | null): value is SettingsSectionId {
  return value !== null && VALID_SECTIONS.has(value);
}

export function useSettingsDialogState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const settingsParam = searchParams.get(SETTINGS_PARAM);
  const isOpen = settingsParam !== null;
  const activeSection: SettingsSectionId = isValidSection(settingsParam)
    ? settingsParam
    : "account";

  function updateSettingsParam(
    value: string | null,
    options?: { replace?: boolean }
  ) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === null) {
        next.delete(SETTINGS_PARAM);
      } else {
        next.set(SETTINGS_PARAM, value);
      }
      return next;
    }, options);
  }

  function onOpenChange(open: boolean) {
    updateSettingsParam(open ? "account" : null);
  }

  function onActiveSectionChange(section: SettingsSectionId) {
    updateSettingsParam(section, { replace: true });
  }

  function openSettings() {
    onOpenChange(true);
  }

  return {
    isOpen,
    activeSection,
    onOpenChange,
    onActiveSectionChange,
    openSettings,
  };
}
