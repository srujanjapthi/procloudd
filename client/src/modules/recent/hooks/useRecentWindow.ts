import { useState } from "react";
import APP_CONFIG from "@/constants/config";

export function useRecentWindow() {
  const [windowDays, setWindowDays] = useState<number>(
    APP_CONFIG.recent.defaultWindowDays
  );

  return { windowDays, setWindowDays };
}
