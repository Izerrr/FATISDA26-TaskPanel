export const BRAND_COLOR = "#1a99e2" as const;

export const APP_URL = (
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://taskpanel.ftsduaenam.web.id"
).replace(/\/+$/, "");

// Hosted statically from the dashboard public assets so Discord embed icons never expire.
export const AUTHOR_ICON = `${APP_URL}/icons/icon-192.png`;

export const FOOTER_ICON = `${APP_URL}/icons/icon-192.png`;

export const FOOTER_TEXT = "FATISDA26 Assistant" as const;

export const AUTHOR_NAME = "FATISDA26 Assistant" as const;
