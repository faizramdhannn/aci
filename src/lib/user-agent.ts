import type { DeviceType } from "@/types";

export function parseUserAgent(uaString: string | null): {
  deviceType: DeviceType;
  browser: string;
  os: string;
} {
  const ua = uaString ?? "";

  let deviceType: DeviceType = "desktop";
  if (/Mobi|iPhone|Android.*Mobile/i.test(ua)) deviceType = "mobile";
  else if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) deviceType = "tablet";

  let browser = "Other";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";

  let os = "Other";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iOS/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  return { deviceType, browser, os };
}
