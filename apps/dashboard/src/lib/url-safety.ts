export interface VaultExtraLinkInput {
  id?: unknown;
  title?: unknown;
  url?: unknown;
  type?: unknown;
  description?: unknown;
}

export type SanitizedVaultExtraLink = {
  id: string;
  title: string;
  url: string;
  type: "DRIVE" | "MODULE" | "SYLLABUS" | "COMMUNITY" | "OTHER";
  description?: string;
};

const VALID_EXTRA_LINK_TYPES = new Set([
  "DRIVE",
  "MODULE",
  "SYLLABUS",
  "COMMUNITY",
  "OTHER",
]);

/**
 * Normalizes a user-supplied URL and ensures only http: / https: protocols are allowed.
 * Rejects dangerous schemes such as javascript:, data:, or vbscript:.
 */
export function normalizeSafeHttpUrl(url?: string | null): string | null {
  if (typeof url !== "string") {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  // Reject explicit non-HTTP(S) URI schemes (e.g. javascript:, data:, file:)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  // Reject protocol-relative URLs or control characters
  if (trimmed.startsWith("//") || /[\u0000-\u001F\u007F]/.test(trimmed)) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validates and sanitizes Course Vault extraLinks payloads before storage.
 */
export function sanitizeVaultExtraLinks(rawLinks: unknown): SanitizedVaultExtraLink[] {
  if (!Array.isArray(rawLinks)) {
    return [];
  }

  const sanitized: SanitizedVaultExtraLink[] = [];

  for (const item of rawLinks) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const raw = item as VaultExtraLinkInput;
    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    const safeUrl = normalizeSafeHttpUrl(typeof raw.url === "string" ? raw.url : null);

    if (!title || !safeUrl) {
      continue;
    }

    const rawType = typeof raw.type === "string" ? raw.type.toUpperCase() : "OTHER";
    const type = (
      VALID_EXTRA_LINK_TYPES.has(rawType) ? rawType : "OTHER"
    ) as SanitizedVaultExtraLink["type"];

    const id =
      typeof raw.id === "string" && raw.id.trim()
        ? raw.id.trim()
        : `link-${sanitized.length + 1}`;

    const description =
      typeof raw.description === "string" && raw.description.trim()
        ? raw.description.trim()
        : undefined;

    sanitized.push({
      id,
      title,
      url: safeUrl,
      type,
      ...(description ? { description } : {}),
    });
  }

  return sanitized;
}
