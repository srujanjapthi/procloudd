import { useState } from "react";

const STORAGE_KEY = "drive-view-mode";

export type DriveViewMode = "list" | "grid";

function readStoredViewMode(): DriveViewMode {
  if (typeof window === "undefined") {
    return "list";
  }
  return window.localStorage.getItem(STORAGE_KEY) === "grid" ? "grid" : "list";
}

export function useDriveViewMode() {
  const [viewMode, setViewModeState] =
    useState<DriveViewMode>(readStoredViewMode);

  function setViewMode(mode: DriveViewMode) {
    setViewModeState(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  }

  return { viewMode, setViewMode };
}
