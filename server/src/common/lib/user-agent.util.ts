import { UAParser } from "ua-parser-js";

export function formatDevice(userAgent?: string): string {
  if (!userAgent) {
    return "Unknown device";
  }

  const { browser, os, device } = UAParser(userAgent);
  const browserName = browser.name ?? "Unknown browser";
  const osName = os.name ?? "Unknown OS";
  const deviceName = [device.vendor, device.model].filter(Boolean).join(" ");

  const base = `${browserName} (${osName})`;
  return deviceName ? `${base} · ${deviceName}` : base;
}
